# ============================================
# Stage 1: Base (Dependências de SO comuns)
# ============================================
FROM node:20-alpine AS base
# Instalar dependências necessárias para Prisma e compiladores para Argon2/Sharp
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

# ============================================
# Stage 2: Dependencies & Build
# ============================================
FROM base AS builder

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para o build)
# Usamos npm ci para garantir instalação limpa baseada no lockfile
RUN npm ci

# Gerar o cliente Prisma
# ENV DATABASE_URL é dummy apenas para o generate funcionar, não conecta no banco
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copiar o restante do código fonte
COPY . .

# Build da aplicação NestJS
RUN npm run build

# Limpar dependências e instalar apenas as de produção para otimizar imagem final
# Isso remove o typescript, eslint, etc.
RUN npm prune --production

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar apenas dependências de runtime do SO (openssl é vital para o Prisma)
RUN apk add --no-cache openssl libc6-compat

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar artefatos do stage de build
# Copiamos o node_modules já processado e compilado no stage anterior
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
# Nota: O migrate deploy deve idealmente rodar em um job separado ou init container em K8s,
# mas para Docker Compose funciona bem aqui.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]