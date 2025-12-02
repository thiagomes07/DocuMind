# Documentação Frontend - Sistema OCR com LLM

## 1. Stack Técnica

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (strict mode)
- **Estilização**: Tailwind CSS
- **Validação**: Zod
- **Autenticação**: Cookie HTTP-only + Refresh Token

### Build Config
```json
{
  "output": "standalone",
  "typescript": { "strict": true },
  "env": "validado com Zod em runtime"
}
```

---

## 2. Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (dashboard)/
│   │   ├── documentos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── layout.tsx
│   ├── api/auth/
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   ├── refresh/route.ts
│   │   └── logout/route.ts
│   ├── layout.tsx
│   └── middleware.ts
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── toast.tsx
│   │   ├── pagination.tsx
│   │   ├── loading.tsx
│   │   └── empty-state.tsx
│   ├── forms/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── upload-form.tsx
│   └── document/
│       ├── document-card.tsx
│       ├── document-list.tsx
│       └── document-viewer.tsx
├── lib/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── documents.ts
│   │   └── llm.ts
│   ├── auth/
│   │   ├── token-manager.ts
│   │   ├── refresh-lock.ts
│   │   └── with-auth.ts
│   ├── validations/
│   │   ├── auth.ts
│   │   └── document.ts
│   └── utils.ts
├── types/
│   ├── auth.ts
│   ├── document.ts
│   └── api.ts
└── contexts/
    ├── auth-context.tsx
    └── toast-context.tsx
```

---

## 3. Autenticação e Tokens

### 3.1 Estratégia de Tokens

| Token | Storage | Duração | Path |
|-------|---------|---------|------|
| Access Token | HTTP-only Cookie | 15 min | / |
| Refresh Token | HTTP-only Cookie | 7 dias | /api/auth/refresh |

**Flags**: `Secure`, `SameSite=Strict`

### 3.2 Fluxo de Renovação Automática

```typescript
// lib/auth/with-auth.ts
export async function withAuth<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    if (error?.status === 401) {
      const { success, shouldLogout } = await refreshWithLock();
      
      if (success) return await action(); // Retry
      if (shouldLogout) {
        await logout();
        redirect('/login');
      }
    }
    throw error;
  }
}
```

### 3.3 Prevenir Múltiplos Refreshes

```typescript
// lib/auth/refresh-lock.ts
let refreshPromise: Promise<TokenRefreshResult> | null = null;

export async function refreshWithLock(): Promise<TokenRefreshResult> {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = refreshAccessToken()
    .finally(() => { refreshPromise = null; });
  
  return refreshPromise;
}
```

### 3.4 Middleware de Proteção

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { accessToken, refreshToken } = getCookies(request);
  const { pathname } = request.nextUrl;
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/registro');
  const isProtected = pathname.startsWith('/documentos');
  
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/documentos', request.url));
  }
  
  if (isProtected && !accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 4. Schemas de Validação

### Login
```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1),
  password: z.string().min(8, 'Mínimo 8 caracteres')
});
```

### Registro
```typescript
const registerSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Requer 1 maiúscula')
    .regex(/[0-9]/, 'Requer 1 número'),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});
```

---

## 5. Contratos de API

### 5.1 Autenticação

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}
// Response: Set-Cookie (access_token, refresh_token)
interface LoginResponse {
  success: boolean;
  user: { id: string; email: string; name: string; }
}

// POST /api/auth/register
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
interface RegisterResponse {
  success: boolean;
  userId: string;
}

// POST /api/auth/refresh
// Request: Envia refresh_token via cookie
// Response: Set-Cookie (novo access_token)
interface RefreshResponse {
  success: boolean;
}

// POST /api/auth/logout
// Response: Limpa ambos os cookies
interface LogoutResponse {
  success: boolean;
}

// GET /api/auth/session
interface SessionResponse {
  userId: string;
  email: string;
  name: string;
  documentsCount: number;
  documentsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
}
```

### 5.2 Documentos

```typescript
// GET /api/documents?page=1&limit=9
interface GetDocumentsResponse {
  documents: Array<{
    id: string;
    filename: string;
    uploadedAt: Date;
    status: 'processing' | 'completed' | 'error';
    thumbnailUrl?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

// POST /api/documents/upload
// Content-Type: multipart/form-data
interface UploadResponse {
  success: boolean;
  documentId?: string;
  error?: string;
}

// GET /api/documents/:id
interface DocumentDetailResponse {
  id: string;
  filename: string;
  uploadedAt: Date;
  fileUrl: string;
  extractedText: string;
  status: string;
  llmInteractions: Array<{
    id: string;
    question: string;
    answer: string;
    tokensUsed: number;
    createdAt: Date;
  }>;
}

// DELETE /api/documents/:id
interface DeleteResponse {
  success: boolean;
}

// GET /api/documents/:id/download
// Returns: PDF Blob
```

### 5.3 LLM

```typescript
// POST /api/llm/ask
interface AskQuestionRequest {
  documentId: string;
  question: string;
}
interface AskQuestionResponse {
  answer: string;
  tokensUsed: number;
  tokensRemaining: number;
}
```

---

## 6. Telas e Funcionalidades

### 6.1 Login (`/login`)

**Layout**: Card centralizado com:
- Logo/Brand
- Input email + senha (com toggle visibility)
- Botão "Entrar"
- Link "Não tem conta?"

**Validações**:
- Email válido
- Senha mínimo 8 caracteres
- Erros inline + toast

**Estados**: Normal, Loading, Error

---

### 6.2 Registro (`/registro`)

**Layout**: Card centralizado com:
- Nome completo
- Email
- Senha + Confirmar senha
- Indicador de força da senha
- Botão "Criar conta"
- Link "Já tem conta?"

**Validações**: Schema registerSchema
**Estados**: Normal, Loading, Error

---

### 6.3 Gestão de Documentos (`/documentos`)

**Com Documentos**:
```
Header: [Logo] Documentos (3/5) [+ Upload] [User ▼] [Sair]
Grid: 3 cols desktop, 2 tablet, 1 mobile
Cards: Thumbnail, filename, data, status, [Ver] [🗑]
Footer: Paginação (9 por página)
```

**Empty State**:
```
Ícone 📄
"Nenhum documento ainda"
"Faça upload do seu primeiro documento"
[Upload Documento]
```

**Funcionalidades**:
- Drag & drop upload
- Progress bar
- Validação: PNG/JPG/PDF < 10MB
- Confirmação de exclusão
- Loading skeleton inicial
- Hover states nos cards
- Toast notifications

**Limite**: Botão upload desabilitado quando 5/5 + tooltip

---

### 6.4 Visualização (`/documentos/[id]`)

**Layout Split**:

```
Left Panel:                 Right Panel:
┌─────────────────┐        ┌──────────────────┐
│ TEXTO EXTRAÍDO  │        │ ASSISTENTE LLM   │
│                 │        │                  │
│ [Texto OCR...]  │        │ 💬 Chat history  │
│                 │        │                  │
│ [Copiar texto]  │        │ Tokens: 150/10k  │
└─────────────────┘        │ [Input pergunta] │
                           │ [Enviar]         │
                           └──────────────────┘
```

**Header**: [← Voltar] filename [Download PDF] [🗑]

**Funcionalidades**:
- Texto OCR com formatação
- Copiar texto com feedback
- Chat com histórico
- Contador de tokens (cores: verde < 70%, amarelo 70-90%, vermelho > 90%)
- Input auto-resize
- Loading: "Pensando..."
- Download PDF com texto + chat

**Estados**:
- Loading OCR (skeleton)
- Erro OCR (botão reprocessar)
- Chat vazio (sugestões)
- Limite tokens (banner aviso)

---

## 7. Componentes UI Base

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
}
```
Estados: Normal, Hover, Active, Disabled, Loading

### Input
```typescript
interface InputProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  error?: string;
  disabled?: boolean;
}
```
Estados: Normal, Focus (borda azul), Error (borda vermelha), Disabled

### Toast
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // default 5000ms
}
```
Posição: top-right, empilhável, auto-dismiss

### Pagination
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```
Exibe max 5 números, botões Anterior/Próxima

### Loading
Tipos: Spinner, Skeleton, Dots

### Empty State
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; }
}
```

---

## 8. Design System

### Cores
```css
--primary-500: #3b82f6;
--primary-600: #2563eb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;
```

### Breakpoints (Tailwind)
- sm: 640px (Mobile landscape)
- md: 768px (Tablet)
- lg: 1024px (Desktop)

### Adaptações
- **Mobile**: Menu hamburger, 1 col, chat em tab
- **Tablet**: 2 cols, sidebar colapsável
- **Desktop**: 3 cols, sidebar fixa, split view

---

## 9. Segurança

- **Tokens**: HTTP-only, Secure, SameSite Strict
- **Validação**: Client (Zod) + Server (sempre revalidar)
- **Rate Limit**: Backend aplica, frontend mostra feedback
- **Upload**: Validação MIME type, max 10MB, preview seguro
- **Sanitização**: DOMPurify se renderizar HTML do OCR

---

## 10. Performance

### Next.js
- Server Components por padrão
- Client Components apenas para interatividade
- Server Actions para mutações
- Dynamic imports para componentes pesados (PDF viewer)
- next/image para thumbnails

### Caching
- Lista documentos: revalidation
- Documento individual: cache agressivo
- Session: cache server-side

### Loading States
- Suspense boundaries
- Skeleton UI (melhor que spinners)
- Optimistic updates (deleção)

---

## 11. Acessibilidade

- Semantic HTML (headings, nav, main)
- ARIA labels (botões ícones, loading states)
- Keyboard navigation (Tab order lógico)
- Focus visible (outline)
- Alt text em imagens
- Color contrast WCAG AA (4.5:1)
- Live regions para toasts
- Labels descritivos

---

## 12. Tratamento de Erros

### Tipos
```typescript
type ErrorType = 'network' | 'validation' | 'business' | 'server';

interface AppError {
  type: ErrorType;
  message: string;
  field?: string;
  code?: string;
  retry?: boolean;
}
```

### Estratégias
1. Toast para feedback rápido
2. Inline errors em formulários
3. Error boundaries para erros críticos
4. Retry automático (3x) para rede
5. Fallback UI para componentes

### Códigos de Negócio
- `DOCUMENT_LIMIT_REACHED`: "Você atingiu o limite de 5 documentos"
- `TOKEN_LIMIT_REACHED`: "Limite de tokens atingido"
- `INVALID_FILE_TYPE`: "Apenas PNG, JPG ou PDF"
- `FILE_TOO_LARGE`: "Arquivo deve ter no máximo 10MB"

---

## 13. Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# Limites (públicos para UI)
NEXT_PUBLIC_MAX_DOCUMENTS=5
NEXT_PUBLIC_MAX_TOKENS=10000
NEXT_PUBLIC_MAX_FILE_SIZE=10485760 # 10MB
```

---

## 14. Fluxos Críticos

### Login com Auto-Refresh
```
User → Login → Set Tokens → Dashboard
Dashboard → API Call → 401? → Auto Refresh → Retry
Refresh Success → Continue
Refresh Fail → Logout → Login
```

### Upload com Validação
```
Select File → Validate Type/Size → Check Limit (5/5?)
Limit OK → Upload + Progress → OCR Processing
Success → Redirect /documentos/[id]
Limit Reached → Toast Error + Disable Upload
```

### Chat LLM com Tokens
```
User Question → Check Token Limit
Tokens OK → Send → Loading → Response → Update Counter
Tokens Low (>90%) → Yellow Warning
Tokens Max → Disable Input + Red Banner
```

---

## 15. Observações Técnicas

### Separação Backend/Frontend
- Frontend: `localhost:3000`
- Backend: `localhost:4000` (NestJS)
- CORS configurado no backend
- Cookies devem funcionar cross-origin (development)

### Deploy
- Frontend: Vercel (recomendado)
- Backend: EC2 Free Tier
- Variáveis de ambiente diferentes por ambiente

### Docker Local
- Backend + Postgres em `docker-compose.yaml`
- Frontend roda fora do Docker (melhor DX)

### Considerações S3
- Backend faz upload para S3
- Frontend recebe URLs assinadas
- Thumbnails gerados no backend