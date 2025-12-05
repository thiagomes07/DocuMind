# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Build Args para variáveis de ambiente de build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_MAX_DOCUMENTS
ENV NEXT_PUBLIC_MAX_DOCUMENTS=$NEXT_PUBLIC_MAX_DOCUMENTS

ARG NEXT_PUBLIC_MAX_TOKENS
ENV NEXT_PUBLIC_MAX_TOKENS=$NEXT_PUBLIC_MAX_TOKENS

ARG NEXT_PUBLIC_MAX_FILE_SIZE
ENV NEXT_PUBLIC_MAX_FILE_SIZE=$NEXT_PUBLIC_MAX_FILE_SIZE

# Build da aplicação
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Copiar apenas o necessário
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3000

# Health check: accept any <400 status to avoid failing on redirects
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD node -e "require('http').get({host:'localhost',port:3000,path:'/api/health',timeout:4000},(r)=>{r.resume();process.exit(r.statusCode < 400 ? 0 : 1)}).on('error',()=>process.exit(1))"

# Comando para iniciar
CMD ["node", "server.js"]