# Deploy API na Vercel (igual ERP-Dantas)

Baseado no projeto [ERP-Dantas](https://github.com/PedroVazN/ERP-Dantas).

## Estrutura

```
server/
  api/index.ts      → importa ../src/index e exporta app
  src/index.ts      → Express + MongoDB + export default app
  vercel.json       → builds + routes (tudo vai para api/index.ts)
```

## Projeto na Vercel

| Campo | Valor |
|-------|-------|
| Root Directory | `server` |
| Framework | Other (detecta vercel.json) |

**Não** configure Output Directory manualmente — o `vercel.json` usa `builds` + `routes`.

## Variáveis de ambiente

```
MONGODB_URI=... (igual ao .env local)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=https://seu-frontend.vercel.app
CLIENT_URLS=https://seu-frontend.vercel.app,http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true
DNS_SERVERS=8.8.8.8,1.1.1.1
```

## MongoDB Atlas

- Network Access: `0.0.0.0/0`

## Testar

- `https://SUA-API.vercel.app/api/health`
- `https://SUA-API.vercel.app/api/dashboard` → dados reais

## Frontend

```
VITE_API_URL=https://SUA-API.vercel.app/api
```
