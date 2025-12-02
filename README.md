# 📄 DocuMind - Sistema OCR com Análise Inteligente via LLM

<div align="center">

![DocuMind Banner](https://img.shields.io/badge/DocuMind-OCR%20%2B%20AI-6366F1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE0IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY4eiIvPjxwb2x5bGluZSBwb2ludHM9IjE0IDIgMTQgOCAyMCA4Ii8+PGxpbmUgeDE9IjE2IiB5MT0iMTMiIHgyPSI4IiB5Mj0iMTMiLz48bGluZSB4MT0iMTYiIHkxPSIxNyIgeDI9IjgiIHkyPSIxNyIvPjxwb2x5bGluZSBwb2ludHM9IjEwIDkgOSA5IDggOSIvPjwvc3ZnPg==)

**Extraia texto de documentos e converse com eles usando Inteligência Artificial**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?style=flat&logo=nestjs)](https://nestjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![AWS](https://img.shields.io/badge/AWS-S3_+_Bedrock-FF9900?style=flat&logo=amazonwebservices)](https://aws.amazon.com/)

</div>

---

## 📋 Sobre o Projeto

**DocuMind** é uma plataforma completa que combina **OCR (Reconhecimento Óptico de Caracteres)** com **LLM (Large Language Models)** para transformar documentos estáticos em fontes de conhecimento interativas.

### 🎯 O Problema
Profissionais e empresas lidam diariamente com documentos físicos ou digitalizados (faturas, contratos, relatórios) que exigem:
- ⏱️ Tempo manual para extrair informações
- 🔍 Dificuldade em localizar dados específicos
- ❌ Impossibilidade de "conversar" com o conteúdo

### ✨ A Solução
Plataforma web que permite:
- 📤 **Upload de documentos** (PNG, JPG, PDF até 10MB)
- 🔤 **Extração automática de texto** via Tesseract.js
- 🤖 **Assistente IA** para perguntas sobre o documento (AWS Bedrock Claude Haiku)
- 📥 **Download de relatório PDF** com texto extraído + histórico de conversas
- 🔒 **Segurança de nível empresarial** (Argon2id, JWT, HTTP-only cookies)

### 🚀 Diferenciais Técnicos

Além dos requisitos do case, foram implementados:

- **🔐 Autenticação robusta**: JWT duplo (access + refresh tokens) com cookies HTTP-only
- **🛡️ Rate limiting multinível**: Nginx (100 req/min) + Guards por usuário/rota
- **📊 Limites de recursos**: 5 documentos e 10.000 tokens LLM por usuário
- **⚖️ Load balancing**: Nginx com health checks automáticos
- **☁️ Storage híbrido**: Suporte simultâneo para S3 (produção) e local (dev)
- **📚 Documentação API**: Swagger UI interativa gerada automaticamente
- **🐳 Deploy simplificado**: Configuração Docker Compose completa

---

## 🚀 Quick Start - Execução Local

### 📦 Pré-requisitos

```bash
# Ferramentas necessárias
- Docker Engine 20.10+
- Docker Compose V2+
- 4GB RAM disponível
- Portas livres: 3000, 4000, 5432, 80

# Verificar instalação
docker --version
docker compose version
```

### ⚙️ 1. Clone e Configure

```bash
# Clone o repositório
git clone <seu-repositorio>
cd documind

# Configure variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 🔑 2. Variáveis de Ambiente Críticas

Edite o arquivo `.env` na raiz:

```bash
# Segurança (⚠️ GERAR VALORES FORTES EM PRODUÇÃO)
JWT_ACCESS_SECRET=seu-secret-forte-aqui-256bits
JWT_REFRESH_SECRET=outro-secret-diferente-256bits
PASSWORD_PEPPER=pepper-global-seguro-256bits

# AWS S3 (obrigatório)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua-chave-aws
AWS_SECRET_ACCESS_KEY=seu-secret-aws
S3_BUCKET=seu-bucket-s3
S3_PREFIX=dev

# AWS Bedrock (Claude Haiku)
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

> **💡 Dica**: Para gerar secrets seguros:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```

### 🐳 3. Execute com Docker Compose

```bash
# Build e inicialização (primeira execução ~2-3 minutos)
docker compose up --build

# Em execuções subsequentes
docker compose up -d
```

**Aguarde a inicialização dos serviços:**
- ✅ PostgreSQL (porta 5432)
- ✅ Backend NestJS - 2 réplicas (portas 4000-4001)
- ✅ Frontend Next.js (porta 3000)
- ✅ Nginx Load Balancer (porta 80)

### 🌐 4. Acesse a Aplicação

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **🎨 Frontend** | [http://localhost:3000](http://localhost:3000) | Interface principal |
| **🔧 API (Load Balanced)** | [http://localhost/api](http://localhost/api) | Gateway Nginx |
| **📚 Documentação API** | [http://localhost/api/docs](http://localhost/api/docs) | Swagger UI |
| **🏥 Health Check** | [http://localhost/api/health](http://localhost/api/health) | Status dos serviços |

### 🛑 5. Gerenciar o Projeto

```bash
# Ver logs em tempo real
docker compose logs -f

# Parar containers (mantém dados)
docker compose stop

# Remover containers (mantém volumes)
docker compose down

# Reset completo (⚠️ APAGA banco de dados)
docker compose down -v
```

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────┐
│  Frontend (Next.js 14 - SSR + Server Actions)   │
│  • TypeScript + Tailwind CSS                    │
│  • React Hook Form + Zod validation             │
│  • HTTP-only cookies para auth                  │
│  └─ http://localhost:3000                       │
│                                                  │
├──────────────────────────────────────────────────┤
│  Nginx (Reverse Proxy + Load Balancer)          │
│  • Rate Limiting: 100 req/min por IP            │
│  • Health checks a cada 30s                     │
│  • SSL termination ready                        │
│  └─ http://localhost:80                         │
│       ▼                                          │
│  ┌─────────────────────────────────┐            │
│  │  NestJS API (2 réplicas)        │            │
│  │  • Ports: 4000-4001             │            │
│  │  • Guards: JWT, RateLimit, etc  │            │
│  └─────────────────────────────────┘            │
│       ▼                                          │
│  ┌─────────────────────────────────┐            │
│  │  PostgreSQL 15 + Prisma ORM     │            │
│  │  • Port: 5432                   │            │
│  │  • Migrations versionadas       │            │
│  └─────────────────────────────────┘            │
│       ▼                                          │
│  ┌─────────────────────────────────┐            │
│  │  AWS S3 (Blob Storage)          │            │
│  │  • Documentos + Thumbnails      │            │
│  │  • Signed URLs (1h)             │            │
│  └─────────────────────────────────┘            │
└──────────────────────────────────────────────────┘

External Services:
├─ AWS Bedrock Claude 3 Haiku (LLM)
└─ Tesseract.js (OCR - open source)
```

### 🔑 Decisões de Arquitetura

**Frontend - Next.js 14 (App Router + SSR)**
- ✅ **Server Actions**: Autenticação server-side com cookies seguros
- ✅ **Middleware nativo**: Proteção de rotas sem overhead
- ✅ **Componentes reativos**: Forms com validação real-time (Zod)
- ✅ **UX moderna**: Toast notifications, loading states, empty states

**Backend - NestJS + Prisma**
- ✅ **Arquitetura modular**: Auth, Documents, LLM, Storage como módulos independentes
- ✅ **Type-safety end-to-end**: DTOs validados com class-validator
- ✅ **Guards customizados**: DocumentLimit, TokenLimit, RateLimit por rota
- ✅ **OCR em background**: Tesseract.js não bloqueia requests
- ✅ **Criptografia forte**: Argon2id (65MB, 3 iterations) com salt + pepper

**Infraestrutura - Docker + Nginx**
- ✅ **Alta disponibilidade**: 2 réplicas backend com failover automático
- ✅ **Rate limiting inteligente**: Nginx (global) + NestJS (granular)
- ✅ **Health checks**: Remove réplicas falhas automaticamente
- ✅ **Escalabilidade**: Pronto para Kubernetes/ECS sem refatoração

---

## 📊 Funcionalidades

### 🔐 Autenticação Segura
- **Registro** com validação forte (email único, senha complexa)
- **Login** com duplo token (access 15min + refresh 7 dias)
- **Renovação automática** de tokens via middleware
- **Logout** com invalidação de refresh token
- **Cookies HTTP-only**: Imunes a XSS attacks

### 📤 Upload e OCR
- **Formatos suportados**: PNG, JPG, PDF (até 10MB)
- **Validação robusta**: Magic bytes (não confia em extensão)
- **Thumbnail automático** para imagens (Sharp)
- **Processamento assíncrono**: OCR não bloqueia response
- **Estados visuais**: Processing → Completed → Error
- **Limite de 5 documentos** por usuário (deletar para liberar espaço)

### 🤖 Assistente IA Contextual
- **Claude 3 Haiku** (AWS Bedrock): Latência ~2s, custo baixo (~$0.25/1M tokens input)
- **Contexto automático**: LLM recebe texto extraído completo
- **Histórico persistido**: Todas as interações salvas no banco
- **Limite de 10.000 tokens** por usuário
- **Contador visual**: Verde (< 70%) → Amarelo (70-90%) → Vermelho (> 90%)
- **Respostas em português**: Prompt otimizado para análise documental

### 📥 Exportação Completa
- **Download PDF compilado**:
  - Página 1: Imagem original do documento
  - Página 2+: Texto extraído formatado
  - Página N: Histórico completo de perguntas e respostas
- **Biblioteca**: PDFKit para geração server-side

### 🛡️ Sistema de Limites e Proteção

| Recurso | Limite | Enforcement |
|---------|--------|-------------|
| **Documentos por usuário** | 5 | Guard `DocumentLimitGuard` |
| **Tokens LLM por usuário** | 10.000 | Guard `TokenLimitGuard` |
| **Tamanho de arquivo** | 10MB | Middleware Multer |
| **Rate limit global** | 100 req/min | Nginx |
| **Rate limit upload** | 3 req/10min | NestJS Throttler |
| **Rate limit login** | 5 req/10min | NestJS Throttler |

---

## 📂 Estrutura do Projeto

```
documind/
├── backend/                         # NestJS + Prisma
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # JWT strategies + guards
│   │   │   ├── documents/          # Upload + OCR + CRUD
│   │   │   ├── llm/                # AWS Bedrock integration
│   │   │   ├── storage/            # S3 abstraction
│   │   │   └── users/              # User management
│   │   ├── common/
│   │   │   ├── guards/             # DocumentLimit, TokenLimit, RateLimit
│   │   │   ├── filters/            # HTTP + Prisma exception handlers
│   │   │   └── interceptors/       # Logging, Transform
│   │   ├── config/                 # Env-based configs (JWT, Storage, LLM)
│   │   └── main.ts                 # Bootstrap + Swagger setup
│   ├── prisma/schema.prisma        # Database schema
│   ├── nginx/nginx.conf            # Load balancer config
│   └── Dockerfile
│
├── frontend/                        # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/                 # Login + Registro (group route)
│   │   ├── (dashboard)/documentos/ # Lista + Detalhes
│   │   └── api/auth/               # Server Actions (cookies)
│   ├── components/
│   │   ├── ui/                     # Button, Input, Toast, Pagination, etc
│   │   ├── forms/                  # LoginForm, RegisterForm, UploadForm
│   │   └── document/               # DocumentCard, DocumentList, DocumentViewer
│   ├── lib/
│   │   ├── actions/                # Server Actions (auth, documents, llm)
│   │   ├── auth/                   # Token management, refresh lock
│   │   └── validations/            # Zod schemas
│   ├── middleware.ts               # Route protection
│   └── Dockerfile
│
└── docker-compose.yaml              # Orquestração completa
```

---

## 🔒 Segurança

### Criptografia de Senhas (Argon2id)
```typescript
{
  type: argon2id,           // Resistente a ataques GPU/ASIC
  memoryCost: 65536,        // 64 MB
  timeCost: 3,              // 3 iterations
  parallelism: 4,
  saltLength: 32            // Único por usuário
}
```
**Armazenamento**: `hash = argon2id(password + pepper, salt)`

### JWT Tokens
| Token | Secret | Duração | Storage | Path |
|-------|--------|---------|---------|------|
| Access | `JWT_ACCESS_SECRET` | 15min | HTTP-only Cookie | `/` |
| Refresh | `JWT_REFRESH_SECRET` | 7 dias | HTTP-only Cookie | `/api/auth/refresh` |

**Flags**: `Secure`, `SameSite=Strict`, `HttpOnly`

### Rate Limiting (Nginx)
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req zone=api_limit burst=10 nodelay;
```

### Validação de Arquivos
- ✅ MIME type via **magic bytes** (primeiros 8 bytes)
- ✅ Tamanho máximo: 10MB
- ✅ Formatos: PNG (`89 50 4E 47`), JPG (`FF D8 FF`), PDF (`25 50 44 46`)

---

## 📊 Custos Estimados

### 🆓 Desenvolvimento Local
- **PostgreSQL**: Docker (grátis)
- **S3**: 5GB Free Tier primeiro ano (~$0.12/mês após)
- **Bedrock Claude Haiku**: ~$0.50/mês (10k perguntas)
- **Total**: ~$0.62/mês

### ☁️ Produção (AWS EC2 Free Tier)
- **EC2 t2.micro**: Free Tier elegível (750h/mês)
- **RDS t3.micro**: ~$15/mês (PostgreSQL gerenciado)
- **S3**: ~$2/mês (50GB + 10k requests)
- **Bedrock**: ~$20/mês (100k perguntas)
- **ALB**: ~$22/mês (se não usar Nginx)
- **Total**: ~$59/mês (com ALB) ou **~$37/mês** (Nginx)

---

## 🧪 Testes

```bash
# Backend (NestJS + Jest)
cd backend
npm run test           # Unit tests
npm run test:e2e       # Integration tests
npm run test:cov       # Coverage report

# Frontend (Next.js + Jest)
cd frontend
npm run test
```

---

## 🚧 Roadmap

### Funcionalidades
- [ ] Suporte a mais idiomas no OCR (espanhol, francês)
- [ ] Upload via drag & drop
- [ ] Compartilhamento de documentos entre usuários
- [ ] Histórico de versões (re-processamento OCR)
- [ ] Export em DOCX/TXT além de PDF
- [ ] Busca full-text no conteúdo extraído

### Performance
- [ ] Queue assíncrona para OCR (Bull/BullMQ)
- [ ] Cache distribuído (Redis)
- [ ] WebSockets para status de processamento real-time
- [ ] Compressão de imagens antes do upload (client-side)

### Infraestrutura
- [ ] CI/CD com GitHub Actions
- [ ] Testes automatizados (80%+ cobertura)
- [ ] Monitoramento (Prometheus + Grafana)
- [ ] Logs estruturados (Winston + CloudWatch)
- [ ] Kubernetes/ECS para auto-scaling
- [ ] Multi-region para baixa latência global

---

## 📚 Documentação API

Após iniciar o projeto, acesse:

**Swagger UI**: [http://localhost/api/docs](http://localhost/api/docs)

### Principais Endpoints

```typescript
// Autenticação
POST   /auth/register          // Criar conta
POST   /auth/login             // Login (retorna cookies)
POST   /auth/refresh           // Renovar access token
POST   /auth/logout            // Logout
GET    /auth/session           // Dados do usuário

// Documentos
GET    /documents              // Listar (paginado)
POST   /documents/upload       // Upload + OCR
GET    /documents/:id          // Detalhes + histórico LLM
DELETE /documents/:id          // Deletar
GET    /documents/:id/download // Download PDF

// LLM
POST   /llm/ask                // Fazer pergunta sobre documento
```

---

## 👨‍💻 Desenvolvedor

<div align="center">
  <table>
    <tr>
      <td align="center" width="300">
        <img src="https://media.licdn.com/dms/image/v2/D4D03AQHh3rHCD36uKA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1711828725384?e=1766016000&v=beta&t=iLJCng1Xa-5zVB_ZWXaIQAl6Sin9XARkGziuFr-S23Y" width="120px;" alt="Foto de Thiago Gomes" style="border-radius:50%"/>
        <br />
        <b>Thiago Gomes</b>
        <br />
        <sub>Engenheiro de Software Fullstack</sub>
        <br /><br />
        <a href="https://github.com/thiagomes07">
          <img src="https://img.shields.io/badge/GitHub-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
        </a>
        <br />
        <a href="https://www.linkedin.com/in/thiagogomesalmeida/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
        </a>
      </td>
      <td align="left" valign="top" width="400">
        <h3>🎯 Sobre</h3>
        <p>
          Desenvolvedor fullstack apaixonado por criar soluções que <strong>impactam o mundo real de verdade</strong>. 
          Este projeto demonstra expertise em:
        </p>
        <ul style="list-style: none; padding: 0;">
          <li>🎨 <strong>Frontend moderno:</strong> Next.js 14, TypeScript, Tailwind CSS, Server Actions</li>
          <li>🔧 <strong>Backend enterprise:</strong> NestJS, Prisma, PostgreSQL, Guards customizados</li>
          <li>🤖 <strong>IA/ML:</strong> Integração AWS Bedrock, OCR com Tesseract.js</li>
          <li>🐋 <strong>DevOps:</strong> Docker Compose, Nginx, Load Balancing, Health Checks</li>
          <li>🔐 <strong>Segurança:</strong> Argon2id, JWT, Rate Limiting, HTTP-only Cookies</li>
          <li>☁️ <strong>Cloud:</strong> AWS (S3, Bedrock, EC2 ready)</li>
          <li>📚 <strong>Documentação:</strong> Swagger, README técnico completo</li>
        </ul>
        <p>
          💬 <strong>Aberto a oportunidades e colaborações!</strong>
        </p>
      </td>
    </tr>
  </table>
</div>
