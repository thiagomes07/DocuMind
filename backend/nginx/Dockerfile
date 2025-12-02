FROM nginx:alpine

# Copiar configuração customizada
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Criar diretórios de log
RUN mkdir -p /var/log/nginx

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost/api/health || exit 1

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]