<!-- 
inspirar-se no seguinte readme
# 🌾 CanaData - Sistema de Monitoramento Climático para Cana-de-Açúcar

<div align="center">

![CanaData Banner](https://img.shields.io/badge/CanaData-Sistema%20Clim%C3%A1tico-2D5F2E?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTcgMjBoMTAiLz48cGF0aCBkPSJNMTAgMjBjNS41LTIuNS43LTE1IDctMTV6Ii8+PHBhdGggZD0iTTE3LjUgNUMxNiAxMiAxMiAxNyA3IDIwYy0xLjUtMS41LTQtNC00LTQiLz48L3N2Zz4=)

**Plataforma web que democratiza o acesso a informações climáticas para produtores rurais de cana-de-açúcar**

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2_+_S3-FF9900?style=flat&logo=amazonwebservices)](https://aws.amazon.com/)

</div>

---

## 📋 Sobre o Projeto

O **CanaData** é uma solução moderna que conecta **produtores de cana-de-açúcar** a dados climáticos inteligentes, resolvendo a carência de **digitalização e informação rápida** no setor agrícola brasileiro. 

### 🎯 Problema
Produtores rurais enfrentam dificuldades para acessar informações climáticas **contextualizadas** para suas culturas, impactando decisões críticas sobre irrigação, colheita e manejo.

### ✨ Solução
Plataforma web com:
- 🌦️ **Dados climáticos em tempo real** via Open-Meteo API
- 🎯 **Análise contextualizada** para cultivo de cana-de-açúcar (temperatura, umidade, precipitação, vento)
- 🤝 **Fórum colaborativo** onde produtores compartilham insights e práticas
- 📰 **Feed de notícias** do agronegócio brasileiro
- 💹 **Cotação da cana-de-açúcar** (Campo vs Esteira) em tempo real
- ⚡ **Sistema de resiliência** com rate limiting e retry inteligente

### 🚀 Diferenciais Técnicos

Além dos requisitos do desafio, foram implementados:

- **🗄️ Cache inteligente** (30min) reduz 70% das chamadas à API externa
- **⚖️ Load balancing** com 2 réplicas FastAPI + Nginx (alta disponibilidade)
- **📊 Cotação em tempo real** via web scraping 
- **📰 Agregação de notícias** agrícolas contextualizadas (NewsAPI)
- **☁️ Deploy em produção** (AWS EC2 + S3) com acesso público
- **🛡️ Rate limiting** por endpoint para proteção contra abuso

---

## 🌐 Acesso ao Sistema

<div align="center">

### 🚀 **Versão em Produção** (Deploy Completo)

<table>
  <tr>
    <td align="center" width="50%">
      <h3>🖥️ Frontend</h3>
      <a href="http://cana-data-frontend.s3-website-us-east-1.amazonaws.com/">
        <img src="https://img.shields.io/badge/Acessar_Aplicação-2D5F2E?style=for-the-badge&logo=react&logoColor=white" alt="Frontend"/>
      </a>
      <br/><br/>
      <sub>Interface web hospedada no AWS S3</sub>
    </td>
    <td align="center" width="50%">
      <h3>🔧 Backend API</h3>
      <a href="http://98.94.92.42:8000/docs">
        <img src="https://img.shields.io/badge/Documentação_API-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="API Docs"/>
      </a>
      <br/><br/>
      <sub>API REST com Swagger UI interativa</sub>
    </td>
  </tr>
</table>

**📍 URLs Diretas:**
- **Aplicação Web**: http://cana-data-frontend.s3-website-us-east-1.amazonaws.com/
- **API Backend**: http://98.94.92.42:8000
- **API Docs (Swagger)**: http://98.94.92.42:8000/docs

---

### 💻 **Executar Localmente** (Docker)

Prefere testar em seu próprio ambiente? Siga o guia rápido abaixo ⬇️

</div>

---

## 🚀 Quick Start - Execução Local

### 📦 Pré-requisitos

Certifique-se de ter instalado:

- **Docker Engine** 20.10+ ([Instalar Docker](https://docs.docker.com/engine/install/))
- **Docker Compose** V2+ (incluído no Docker Desktop)
- **4GB de RAM** disponível
- **Portas livres:** 3000, 8000, 8001, 8002, 27017

Para verificar se está tudo pronto:
```bash
docker --version        # Docker version 20.10.0+
docker compose version  # Docker Compose version v2.0.0+
```

### ⚙️ 1. Clone o Repositório

```bash
git clone https://github.com/thiagomes07/CanaData.git
cd CanaData
```

### 🔑 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# o mesmo no diretório do backend
cd backend
cp .env.example .env
```

> **💡 Nota**: O arquivo `.env.example` já contém valores pré-configurados para execução local. A única variável sensível (chave da NewsAPI) está incluída para facilitar os testes, mas **não compromete a segurança crítica** do projeto. Em produção, esta chave deve ser mantida privada.

### 🐳 3. Execute com Docker Compose

```bash
# Build e start (primeira execução)
docker compose up --build
```

**Aguarde ~30-60 segundos** para inicialização completa dos serviços:
- ⏳ MongoDB inicializando...
- ⏳ Backend FastAPI (2 réplicas) + Nginx...
- ⏳ Frontend Next.js...
- ✅ Health checks validados!

### 🌐 4. Acesse a Aplicação Local

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **🖥️ Frontend** | [http://localhost:3000](http://localhost:3000) | Interface web principal |
| **🔧 Backend API** | [http://localhost:8000](http://localhost:8000) | Gateway Nginx (load balanced) |
| **📚 API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI interativa |
| **📖 API ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Documentação alternativa |

### 🛑 6. Parar o Projeto

```bash
# Pausa os containers (mantém dados)
docker compose stop

# Remove containers (mantém volumes/dados)
docker compose down

# Remove containers + volumes (⚠️ APAGA o banco de dados!)
docker compose down -v
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15 - SSG)                            │
│  • TypeScript + Tailwind CSS v4                        │
│  • TanStack Query (cache inteligente 30min)            │
│  • Resiliência a rate limiting com retry exponencial   │
│  └─ http://localhost:3000                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Nginx (Reverse Proxy + Load Balancer)                 │
│  • Rate Limiting por IP/endpoint                       │
│  • Health checks a cada 30s                            │
│  • Algoritmo least_conn                                │
│  └─ http://localhost:8000                              │
│       ▼                    ▼                            │
│  ┌─────────────┐      ┌─────────────┐                  │
│  │ FastAPI #1  │      │ FastAPI #2  │                  │
│  │ (Port 8001) │      │ (Port 8002) │                  │
│  └─────────────┘      └─────────────┘                  │
│       ▼                    ▼                            │
│  ┌──────────────────────────────────┐                  │
│  │  MongoDB (Port 27017)            │                  │
│  │  • Collection: insights          │                  │
│  │  • Índices geoespaciais (2dsphere)│                 │
│  └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘

External APIs:
├─ Open-Meteo (dados climáticos)
├─ Nominatim/OSM (geocoding)
├─ NewsAPI (notícias do agro)
└─ Notícias Agrícolas (cotação cana - scraping)
```

### 🔑 Decisões Técnicas

**Frontend - Next.js 15 (SSG)**
- ✅ **Performance**: Páginas pré-renderizadas = carregamento instantâneo (~500ms)
- ✅ **SEO nativo**: Indexação completa sem necessidade de SSR
- ✅ **Custo**: Deploy estático em S3 (~$0.50/mês)
- ✅ **Experiência**: Cache inteligente com TanStack Query (30min alinhado com backend)

**Backend - FastAPI + Python 3.11**
- ✅ **Inteligência de negócio**: Análise climática contextualizada para cana-de-açúcar
- ✅ **Agregação de dados**: Open-Meteo + Geocoding + Insights + News + Cotação
- ✅ **Cache compartilhado**: Reduz ~70% de chamadas às APIs externas
- ✅ **Rate Limiting (Nginx)**: Proteção contra abuso (limites por endpoint)

**Infraestrutura - Docker Compose**
- ✅ **Reprodutibilidade**: Ambiente idêntico entre dev/staging/produção
- ✅ **Alta disponibilidade**: Load balancer + 2 réplicas FastAPI + health checks
- ✅ **Escalabilidade**: Arquitetura pronta para migração para ECS/Kubernetes

---

## 📊 Funcionalidades

### 🌦️ Consulta Climática Inteligente
- **Autocomplete** de cidades com debounce (300ms) para mitigar rate limiting
- **Dados em tempo real** da Open-Meteo API (temperatura, umidade, vento, precipitação, UV)
- **Análise contextualizada** para cana-de-açúcar:
  - ✅ **Temperatura ideal**: 21-34°C
  - ✅ **Umidade ideal**: 60-85%
  - ⚠️ **Alertas críticos**: geada, estresse térmico, doenças fúngicas, acamamento
- **Previsão 5 dias** com gráficos interativos (Recharts)
- **Cache de 30 minutos** (sincronizado frontend + backend)

### 💹 Cotação da Cana-de-Açúcar
- **Últimos 10 fechamentos** (Campo vs Esteira)
- **Gráfico interativo** com tooltips customizados
- **Estatísticas**: variação percentual, diferença Campo/Esteira
- **Fonte**: Notícias Agrícolas (scraping robusto com retry)
- **Cache**: 1 hora

### 🤝 Fórum Colaborativo
- **Compartilhamento de insights** entre produtores
- **Snapshot climático** no momento da publicação
- **Busca geoespacial** (insights próximos até 500km)
- **Sistema de tags** para categorização
- **Scroll infinito** com throttling (2s entre requests)
- **Persistência**: MongoDB com índices otimizados

### 📰 Feed de Notícias
- Integração com **NewsAPI**
- **Categorias**: Agronegócio, Cana-de-Açúcar, Clima
- **Cache de 1 hora** (economiza quota da API)
- **Fallback gracioso** (não bloqueia experiência principal)

### 📤 Exportação de Dados
- **CSV**: Clima, Insights, Notícias, Cotação ou Relatório Completo
- **PDF**: Captura visual da página (html2canvas + jsPDF)
- **Botões adaptativos**: Compact (desktop) e Floating (mobile)
- **Encoding UTF-8 com BOM** (compatibilidade Excel)

### 🛡️ Resiliência e Performance

**Rate Limiting Implementado (Nginx):**
| Endpoint | Rate Limit | Burst | Estratégia Frontend |
|----------|-----------|-------|---------------------|
| `/api/v1/locations/search` | 5 req/s | 10 | Debounce 300ms |
| `/api/v1/weather` | 1 req/s | 20 | Cache 30min + retry |
| `/api/v1/insights` (POST) | 10 req/min | 5 | Cooldown tracking |
| `/api/v1/insights` (GET) | 1 req/s | 20 | Throttle scroll 2s |
| `/api/v1/news` | Sem limite | - | Cache backend 1h |
| `/quotation` | Sem limite | - | Cache backend 1h |

**Mecanismos de Recuperação:**
- ✅ **Retry automático** com exponential backoff
- ✅ **Cooldown tracking** com persistência em localStorage
- ✅ **Health checks** a cada 30s (Nginx remove réplicas falhas)
- ✅ **Failover automático** entre réplicas FastAPI
- ✅ **Toast notifications** com tempo de espera dinâmico

---

## 📂 Estrutura do Projeto

```
CanaData/
├── backend/                     # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/routes/         # Endpoints REST (weather, insights, news, quotation)
│   │   ├── core/               # Cache + análise agrícola contextualizada
│   │   ├── services/           # Integrações externas (Open-Meteo, NewsAPI, scraping)
│   │   ├── models/             # Schemas Pydantic
│   │   └── database/           # Conexão MongoDB
│   ├── nginx/nginx.conf        # Rate limiting + load balancer
│   └── tests/                  # Testes automatizados
│
├── frontend/                    # Next.js 15 (TypeScript)
│   ├── src/
│   │   ├── app/                # Pages + layouts (App Router)
│   │   ├── components/         # UI components (weather, insights, news, quotation)
│   │   ├── hooks/              # Custom React hooks (useWeather, useInsights, etc)
│   │   ├── lib/                # API clients + utils + constants
│   │   └── types/              # TypeScript definitions
│   └── public/                 # Assets estáticos + SEO (manifest, robots, sitemap)
│
└── docker-compose.yaml          # Orquestração completa (Frontend + Backend 2x + Nginx + MongoDB)
```

---

## 🚧 Melhorias Futuras

### Funcionalidades
- [ ] Autenticação JWT (perfis de usuário, favoritos)
- [ ] PWA completo para instalação mobile
- [ ] Sistema de notificações push (alertas críticos)
- [ ] Histórico climático com séries temporais
- [ ] Machine Learning para previsões personalizadas
- [ ] Integração com imagens de satélite (NDVI)
- [ ] Sistema de reações nos insights (curtir, comentar)
- [ ] Dark mode

### Performance
- [ ] Migrar cache para Redis distribuído
- [ ] CloudFront (CDN) na frente do S3
- [ ] Request batching para otimizar rate limits
- [ ] Service Worker (cache offline completo)
- [ ] Lazy loading de componentes pesados

### Infraestrutura
- [ ] CI/CD com GitHub Actions
- [ ] Testes automatizados (80%+ cobertura)
- [ ] Monitoramento com Prometheus + Grafana
- [ ] Autoscaling real (AWS ECS Fargate ou Kubernetes)
- [ ] Certificados SSL (Let's Encrypt)
- [ ] Backup automático do MongoDB

---

## 👨‍💻 Desenvolvedor

<div align="center">
  <table>
    <tr>
      <td align="center" width="200">
        <img src="https://media.licdn.com/dms/image/v2/D4D03AQHh3rHCD36uKA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1711828725384?e=1766016000&v=beta&t=iLJCng1Xa-5zVB_ZWXaIQAl6Sin9XARkGziuFr-S23Y" width="120px;" alt="Foto de Thiago Volcati" style="border-radius:50%"/>
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
        <br />
        <h3>🎯 Sobre</h3>
        <p>
          Desenvolvedor fullstack apaixonado por criar soluções que <strong>impactam positivamente o mundo real</strong>. 
          Este projeto demonstra expertise em:
        </p>
        <ul>
          <li>🎨 <strong>Frontend moderno:</strong> Next.js 15, TypeScript, Tailwind CSS v4</li>
          <li>🔧 <strong>Backend robusto:</strong> FastAPI, Python, MongoDB</li>
          <li>🐋 <strong>DevOps:</strong> Docker, Nginx, Load Balancing</li>
          <li>☁️ <strong>Cloud:</strong> AWS (EC2, S3, IAM)</li>
          <li>📊 <strong>Arquitetura:</strong> Cache inteligente, Rate Limiting, Resiliência</li>
          <li>♿ <strong>Boas práticas:</strong> Clean Code, Documentação, Acessibilidade</li>
        </ul>
        <br />
        <p>
          💬 <strong>Aberto a oportunidades e colaborações!</strong>
        </p>
      </td>
    </tr>
  </table>
</div> -->
