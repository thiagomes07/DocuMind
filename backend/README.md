# Documentação Backend - Sistema OCR com LLM

## 1. Stack Técnica

- **Framework**: NestJS 10+
- **ORM**: Prisma
- **Runtime**: Node.js 20+
- **Linguagem**: TypeScript (strict mode)
- **Banco de Dados**: PostgreSQL 15+ (Docker)
- **Blob Storage**: AWS S3
- **Autenticação**: JWT (Access + Refresh Tokens)
- **Criptografia**: Argon2id com salt e pepper
- **OCR**: Tesseract.js (open-source)
- **LLM**: AWS Bedrock Claude 3 Haiku
- **Documentação**: Swagger/OpenAPI

---

## 2. Arquitetura do Sistema

```
┌─────────────┐
│   Nginx     │ ← Load Balancer + Rate Limit (100 req/min por IP)
└──────┬──────┘
       │
┌──────▼──────────┐
│   NestJS API    │ ← Rate Limit por rota/usuário
│   Port 4000     │
└─────┬──┬────┬───┘
      │  │    │
   ┌──▼──▼──┐ │
   │PostgreSQL│ │
   │ Docker  │ │
   └─────────┘ │
               │
        ┌──────▼─────────┐
        │  AWS S3 Bucket │
        └────────────────┘
```

### Componentes Principais

**Nginx** (Load Balancer)
- Reverse proxy para API
- Rate limit global: 100 req/min por IP
- SSL/TLS termination (produção)
- Health check: `GET /health`

**NestJS Application**
- Rate limit por usuário: 30 req/min (padrão)
- Throttle upload: 3 req/10min por usuário
- Guards: JWT, DocumentLimit, TokenLimit
- Interceptors: Logging, Transform
- Pipes: Validation

**PostgreSQL + Prisma**
- Container Docker (local e produção)
- Migrations versionadas
- Índices otimizados para queries principais

**AWS S3**
- Bucket único multi-ambiente
- Prefixos: `dev/`, `prod/`
- Signed URLs (1h expiração)

---

## 3. Estrutura de Diretórios

```
src/
├── main.ts
├── app.module.ts
├── prisma/
│   └── schema.prisma
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── refresh-auth.guard.ts
│   │   └── dto/
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── dto/
│   │   └── processors/
│   │       └── ocr.processor.ts
│   ├── llm/
│   │   ├── llm.module.ts
│   │   ├── llm.controller.ts
│   │   ├── llm.service.ts
│   │   └── dto/
│   └── storage/
│       ├── storage.module.ts
│       └── storage.service.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── prisma-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── guards/
│       ├── rate-limit.guard.ts
│       ├── document-limit.guard.ts
│       └── token-limit.guard.ts
└── config/
    ├── app.config.ts
    ├── database.config.ts
    ├── jwt.config.ts
    ├── storage.config.ts
    └── llm.config.ts
```

---

## 4. API Endpoints

### 4.1 Autenticação (`/auth`)

| Método | Endpoint | Auth | Descrição | Rate Limit |
|--------|----------|------|-----------|------------|
| POST | `/auth/register` | Não | Criar conta | 5 req/10min por IP |
| POST | `/auth/login` | Não | Login | 5 req/10min por IP |
| POST | `/auth/refresh` | Refresh Token | Renovar access token | 10 req/min |
| POST | `/auth/logout` | Access Token | Logout | 30 req/min |
| GET | `/auth/session` | Access Token | Dados da sessão | 30 req/min |

### 4.2 Documentos (`/documents`)

| Método | Endpoint | Auth | Descrição | Rate Limit |
|--------|----------|------|-----------|------------|
| GET | `/documents` | ✓ | Listar documentos (paginado) | 30 req/min |
| POST | `/documents/upload` | ✓ | Upload documento | 3 req/10min |
| GET | `/documents/:id` | ✓ | Detalhes + histórico LLM | 30 req/min |
| DELETE | `/documents/:id` | ✓ | Deletar documento | 10 req/min |
| GET | `/documents/:id/download` | ✓ | Download PDF compilado | 30 req/min |

### 4.3 LLM (`/llm`)

| Método | Endpoint | Auth | Descrição | Rate Limit |
|--------|----------|------|-----------|------------|
| POST | `/llm/ask` | ✓ | Fazer pergunta sobre documento | 10 req/min |

### 4.4 Sistema

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/health` | Não | Health check |
| GET | `/docs` | Não | Swagger UI |

---

## 5. Contratos de API

### 5.1 POST `/auth/register`

**Request**:
```typescript
{
  name: string;      // 3-100 chars
  email: string;     // valid email, unique
  password: string;  // min 8, 1 uppercase, 1 number
}
```

**Response** (201):
```typescript
{
  success: true;
  userId: string;
}
```

**Errors**: 400 (validação), 409 (email existe)

---

### 5.2 POST `/auth/login`

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Response** (200):
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
  }
}
// + Set-Cookie: access_token (HttpOnly, Secure, SameSite=Strict, 15min)
// + Set-Cookie: refresh_token (HttpOnly, Secure, SameSite=Strict, 7d, Path=/auth/refresh)
```

**Errors**: 401 (credenciais inválidas)

---

### 5.3 POST `/auth/refresh`

**Request**: Cookie `refresh_token`

**Response** (200):
```typescript
{
  success: true;
}
// + Set-Cookie: novo access_token
```

**Errors**: 401 (token inválido/expirado)

---

### 5.4 POST `/auth/logout`

**Response** (200):
```typescript
{
  success: true;
}
// + Clear cookies
```

---

### 5.5 GET `/auth/session`

**Response** (200):
```typescript
{
  userId: string;
  email: string;
  name: string;
  documentsCount: number;
  documentsLimit: number;      // 5
  tokensUsed: number;
  tokensLimit: number;         // 10000
}
```

---

### 5.6 GET `/documents?page=1&limit=9`

**Query Params**:
- `page`: default 1
- `limit`: default 9, max 50

**Response** (200):
```typescript
{
  documents: Array<{
    id: string;
    filename: string;
    uploadedAt: string;        // ISO 8601
    status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
    thumbnailUrl?: string;     // Signed URL
  }>;
  total: number;
  page: number;
  totalPages: number;
}
```

---

### 5.7 POST `/documents/upload`

**Request**: `multipart/form-data`
- Field: `file` (PNG/JPG/PDF, max 10MB)

**Response** (201):
```typescript
{
  success: true;
  documentId: string;
}
```

**Errors**:
- 400: Arquivo inválido
- 403: Limite de documentos atingido (5)
- 413: Arquivo muito grande

**Fluxo de Processamento**:
1. Validar tipo MIME (magic bytes) e tamanho
2. Verificar limite de documentos do usuário
3. Upload para S3 (`{env}/documents/{userId}/{documentId}.{ext}`)
4. Gerar thumbnail se for imagem (Sharp)
5. Criar registro no DB (status: PROCESSING)
6. Processar OCR em background
7. Retornar resposta imediata

---

### 5.8 GET `/documents/:id`

**Response** (200):
```typescript
{
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  fileUrl: string;             // Signed URL (1h)
  extractedText: string;
  status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
  llmInteractions: Array<{
    id: string;
    question: string;
    answer: string;
    tokensUsed: number;
    createdAt: string;
  }>;
}
```

**Errors**: 404 (não encontrado), 403 (outro usuário)

---

### 5.9 DELETE `/documents/:id`

**Response** (200):
```typescript
{
  success: true;
}
```

**Ações**:
1. Verificar ownership
2. Deletar arquivo e thumbnail do S3
3. Deletar registro DB (cascade: LLMInteractions)
4. Decrementar `User.documentsCount`

---

### 5.10 GET `/documents/:id/download`

**Response** (200):
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="document-{timestamp}.pdf"`
- Body: PDF Buffer

**Conteúdo do PDF**:
- Página 1: Imagem original (se aplicável)
- Página 2+: Texto extraído formatado
- Página N: Histórico LLM Q&A

**Biblioteca**: PDFKit ou similar

---

### 5.11 POST `/llm/ask`

**Request**:
```typescript
{
  documentId: string;
  question: string;            // max 500 chars
}
```

**Response** (200):
```typescript
{
  answer: string;
  tokensUsed: number;
  tokensRemaining: number;
}
```

**Errors**:
- 400: Documento ainda processando ou pergunta inválida
- 403: Limite de tokens atingido
- 404: Documento não encontrado

**Fluxo**:
1. Verificar `tokensUsed < tokensLimit`
2. Buscar documento e texto extraído
3. Montar prompt com contexto
4. Chamar Bedrock Claude Haiku
5. Calcular tokens usados (resposta da API)
6. Atualizar `User.tokensUsed`
7. Criar `LLMInteraction`
8. Retornar resposta

---

## 6. Segurança

### 6.1 Criptografia de Senhas

**Argon2id**:
```typescript
{
  type: argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,
  parallelism: 4,
  saltLength: 32        // Random per user
}
```

**Storage**: `passwordHash = argon2id(password + pepper, salt)`
- Salt: Único por usuário, armazenado em `User.passwordSalt`
- Pepper: Global, definido em `PASSWORD_PEPPER` (env)

### 6.2 JWT

**Access Token**:
```typescript
{
  payload: { sub: userId, email, type: 'access' },
  secret: JWT_ACCESS_SECRET,
  expiresIn: '15m'
}
```

**Refresh Token**:
```typescript
{
  payload: { sub: userId, type: 'refresh', jti: uuid() },
  secret: JWT_REFRESH_SECRET,
  expiresIn: '7d'
}
```

**Armazenamento**:
- Cookies HttpOnly, Secure, SameSite=Strict
- Refresh token hasheado em `User.refreshTokenHash`
- Suporta apenas 1 refresh token ativo (single device)
- Logout invalida refresh token (set null)

### 6.3 Rate Limiting

**Camadas**:
1. **Nginx**: 100 req/min por IP (global)
2. **NestJS Guards**: Por rota/usuário (ver tabela endpoints)

**Implementação**:
- In-memory counter (POC)
- Resposta 429 com header `Retry-After`

### 6.4 Validação de Arquivos

- MIME type via magic bytes (não confiar em extension)
- Max size: 10MB (middleware antes do upload)
- Formatos permitidos: PNG, JPG, PDF

### 6.5 CORS

```typescript
{
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}
```

---

## 7. Storage (AWS S3)

### 7.1 Estrutura de Chaves

```
{bucket}/
├── dev/
│   ├── documents/{userId}/{documentId}.{ext}
│   └── thumbnails/{userId}/{documentId}_thumb.jpg
└── prod/
    └── (mesma estrutura)
```

### 7.2 Storage Service

**Métodos Principais**:
- `uploadDocument(file, userId, documentId): Promise<string>`
- `generateThumbnail(s3Key): Promise<string>` (Sharp)
- `getSignedUrl(s3Key, expiresIn = 3600): Promise<string>`
- `deleteObject(s3Key): Promise<void>`

**Biblioteca**: `@aws-sdk/client-s3` v3

---

## 8. OCR Processing

### 8.1 Tesseract.js

**Escolha**: Open-source, gratuito, qualidade adequada para POC

**Configuração**:
```typescript
{
  lang: 'eng+por',           // Inglês + Português
  oem: 1,                    // LSTM neural net mode
  psm: 3                     // Automatic page segmentation
}
```

### 8.2 Processamento

**Fluxo**:
1. Download arquivo do S3
2. Converter PDF para imagens se necessário (pdf-poppler)
3. Processar com Tesseract
4. Concatenar texto de múltiplas páginas
5. Atualizar `Document`:
   - `status = 'COMPLETED'`
   - `extractedText = result`
   - `ocrCompletedAt = now()`
6. Em caso de erro:
   - `status = 'ERROR'`
   - `errorMessage = error.message`

**Modo**: Background (fire-and-forget) sem blocking

---

## 9. LLM Integration

### 9.1 AWS Bedrock - Claude 3 Haiku

**Modelo**: `anthropic.claude-3-haiku-20240307-v1:0`

**Preços**:
- Input: ~$0.25 por 1M tokens
- Output: ~$1.25 por 1M tokens

**Latência**: ~2-3s

### 9.2 Prompt Template

```typescript
const prompt = `Você é um assistente de análise de documentos. 
Responda em português de forma clara e objetiva.

DOCUMENTO:
${extractedText}

PERGUNTA: ${question}

Baseie sua resposta apenas no conteúdo do documento.`;
```

### 9.3 Token Counting

- Bedrock retorna tokens exatos na resposta
- Usar valor real para atualizar `User.tokensUsed`
- Guard verifica limite antes de processar

### 9.4 Limite de Tokens

**Configuração**: 10.000 tokens por usuário (env: `MAX_TOKENS_PER_USER`)

**Enforcement**: Guard `TokenLimitGuard` em `/llm/ask`

---

## 10. Load Balancer (Nginx)

### 10.1 Configuração

```nginx
upstream nestjs_backend {
    server localhost:4000;
}

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

server {
    listen 80;
    server_name localhost;

    location / {
        limit_req zone=api_limit burst=10 nodelay;
        
        proxy_pass http://nestjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        proxy_pass http://nestjs_backend;
        access_log off;
    }
}
```

### 10.2 Health Check

```typescript
// GET /health
{
  status: 'ok',
  timestamp: '2024-01-15T10:30:00.000Z',
  database: 'connected',
  storage: 'accessible'
}
```

---

## 11. Variáveis de Ambiente

```bash
# App
NODE_ENV=development|production
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ocr_db

# JWT & Security
JWT_ACCESS_SECRET=<random-256-bit>
JWT_REFRESH_SECRET=<random-256-bit>
PASSWORD_PEPPER=<random-256-bit>

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET=ocr-app-bucket
S3_PREFIX=dev

# AWS Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Limites
MAX_DOCUMENTS_PER_USER=5
MAX_TOKENS_PER_USER=10000
MAX_FILE_SIZE_MB=10
```

---

## 12. Escopo POC vs. Produção

### 12.1 Implementado (POC)

✅ Single instance NestJS  
✅ In-memory rate limiting  
✅ Background OCR processing (sync)  
✅ Nginx básico  
✅ Logs stdout  
✅ Cookie-based auth  
✅ Guards para limites (docs/tokens)  

### 12.2 Roadmap Futuro

**Escalabilidade**:
- Múltiplas instâncias NestJS (horizontal scaling)
- Redis para rate limiting distribuído
- Bull/BullMQ para queue OCR
- PgBouncer para connection pooling
- Read replicas (PostgreSQL)

**Observabilidade**:
- Testes unitários e E2E (Jest)
- Logging estruturado (Winston + CloudWatch)
- Monitoring (Prometheus + Grafana)
- APM (Sentry para errors)
- Health checks avançados

**Infraestrutura**:
- AWS ALB ao invés de Nginx
- RDS gerenciado ao invés de PostgreSQL local
- CloudFront CDN
- Auto-scaling EC2
- CI/CD pipeline (GitHub Actions)

**Features**:
- Upload via chunk para arquivos grandes
- Compartilhamento de documentos entre usuários
- Webhooks para notificações
- Suporte a mais idiomas no OCR
- Cache de respostas LLM similares

---

## 13. Estimativa de Custos AWS

**POC (Free Tier EC2)**:
- S3 (5GB + 1k requests): ~$0.15/mês
- Bedrock (10k perguntas): ~$0.50/mês
- **Total**: ~$0.65/mês

**Produção (100 usuários ativos)**:
- EC2 t3.small: ~$15/mês
- RDS t3.micro: ~$15/mês
- S3 + transfers: ~$5/mês
- Bedrock: ~$20/mês
- **Total**: ~$55/mês

---

## 14. Comandos Úteis

```bash
# Setup
npm install
npx prisma generate
npx prisma migrate dev

# Desenvolvimento
npm run start:dev
npx prisma studio        # DB GUI

# Build
npm run build
npm run start:prod

# Docker (PostgreSQL)
docker-compose up -d
docker-compose logs -f postgres
```

---

## 15. Documentação API (Swagger)

**URL Local**: `http://localhost:4000/docs`

**Configuração**:
- Auto-gerada via decorators NestJS
- Schemas via `class-validator`
- Auth via cookie (access_token)

**Incluir**:
- Todos os endpoints documentados
- DTOs de request/response
- Códigos de erro
- Rate limits por rota