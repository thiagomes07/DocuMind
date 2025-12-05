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

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências limpas
RUN npm ci

# Define a variável dummy para o generate não reclamar
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# AQUI É O PULO DO GATO:
# O schema agora tem binaryTargets, então ele vai baixar o engine correto para Alpine
RUN npx prisma generate

COPY . .

RUN npm run build
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
# Se houver migrations, roda migrate deploy; caso contrário, faz db push para criar o schema.
CMD ["sh", "-c", "if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations)\" ]; then npx prisma migrate deploy; else npx prisma db push; fi && node dist/main.js"]