# eSentinel 2 — Sistema de Gestão de Produtos & Estoque

Sistema completo, moderno e responsivo para gestão de produtos, categorias, estoque, fabricação e relatórios. Construído com **Vite + React + TypeScript + Tailwind** no front-end e **Express + MongoDB + Cloudinary** no back-end.

## Recursos

- Dashboard administrativo com gráficos em tempo real
- CRUD completo de categorias com cores e ícones
- Catálogo de produtos com vista grid/lista, filtros avançados e busca
- Cadastro com campos: nome, descrição, fragrância, formato, peso líquido, coloração, categoria, preço, estoque
- Upload múltiplo de imagens com pré-visualização e drag-and-drop
- Importação em massa via Excel (.xlsx) com modelo para download
- Controle de estoque (entrada, saída, ajuste) com histórico completo
- Sistema de fabricação que **adiciona automaticamente ao estoque**
- Tabela de preços agrupada por categoria com cálculo de margem
- Relatórios em Excel para estoque, movimentações, fabricação e preços
- Cloudinary para upload otimizado de imagens (com fallback local)
- API RESTful integrada ao MongoDB

## Estrutura do Projeto

```
esentinel2/
├── server/        # API Node.js + Express + MongoDB + Cloudinary
└── client/        # Front-end Vite + React + TypeScript + Tailwind
```

## Pré-requisitos

- Node.js 18+
- MongoDB local ou conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
- Conta gratuita no [Cloudinary](https://cloudinary.com/) (opcional, com fallback para uploads locais)

## Instalação e configuração

### 1) Backend

```bash
cd server
npm install
copy .env.example .env       # Windows (PowerShell ou CMD)
# cp .env.example .env       # Linux/Mac
```

Edite `server/.env` com suas credenciais:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/esentinel2
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
CLOUDINARY_FOLDER=esentinel2
```

> Se não configurar o Cloudinary, o servidor usa a pasta `uploads/` como fallback. Para produção, recomenda-se sempre usar o Cloudinary.

Comandos disponíveis no backend:

```bash
npm run dev      # inicia em modo desenvolvimento (hot-reload)
npm run build    # compila TypeScript para dist/
npm start        # roda a versão compilada
npm run seed     # popula o banco com categorias e produtos de exemplo
```

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

A aplicação abrirá em `http://localhost:5173` e fará proxy automático para a API em `http://localhost:4000`.

## Importação Excel

Acesse **Produtos → Importar** e baixe o modelo. Colunas suportadas (não importa a ordem; nomes são case-insensitive):

| Coluna | Obrigatório |
|---|---|
| Nome do Produto | Sim |
| SKU | Não |
| Descrição | Não |
| Fragrância | Não |
| Formato | Não |
| Peso Líquido | Não |
| Coloração | Não |
| Categoria | Não (criada automaticamente se não existir) |
| Preço | Não |
| Custo | Não |
| Quantidade em Estoque | Não |
| Estoque Mínimo | Não |

## API — endpoints principais

```
GET    /api/health
GET    /api/dashboard

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/upload          # multipart: images[]
POST   /api/products/:id/images
DELETE /api/products/:id/images/:publicId
POST   /api/products/import          # multipart: file (.xlsx)
GET    /api/products/export/template

GET    /api/stock/movements
POST   /api/stock/entrada
POST   /api/stock/saida
POST   /api/stock/ajuste

GET    /api/manufacturing
POST   /api/manufacturing            # adiciona automaticamente ao estoque
DELETE /api/manufacturing/:id        # estorna do estoque

GET    /api/reports/stock            # .xlsx
GET    /api/reports/movements        # .xlsx ?from=&to=
GET    /api/reports/manufacturing    # .xlsx ?from=&to=
GET    /api/reports/prices           # .xlsx
```

## Tecnologias

**Backend:** Node.js, Express 4, TypeScript, MongoDB (Mongoose), Cloudinary, Multer, xlsx, Zod, Morgan
**Frontend:** Vite, React 18, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts, Axios, Lucide Icons, React Hot Toast

## Comandos rápidos

```bash
# Em duas janelas de terminal:
cd server && npm run dev
cd client && npm run dev
```

Acesse `http://localhost:5173` e comece a usar.
