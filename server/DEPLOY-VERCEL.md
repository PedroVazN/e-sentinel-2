# API na Vercel (pasta `server`)

## Configuração do projeto

| Campo | Valor |
|-------|-------|
| Root Directory | `server` |
| Framework | Other |
| Build Command | `npm run build` |
| Output Directory | `public` |
| Install Command | `npm install --include=dev` |

## Variáveis de ambiente (obrigatórias)

```
MONGODB_URI=... (igual ao seu .env local que funciona)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=https://seu-frontend.vercel.app
```

## MongoDB Atlas

- Network Access: `0.0.0.0/0`
- Cluster preferencialmente em **South America (São Paulo)**

## Testar após deploy

1. `https://SUA-API.vercel.app/api/health` → `"db": "connected"`
2. `https://SUA-API.vercel.app/api/dashboard` → JSON com `totals` (dados reais)
3. Frontend: `VITE_API_URL=https://SUA-API.vercel.app/api`

## Plano Vercel

- **Hobby (grátis):** limite ~10s por requisição — primeira conexão MongoDB pode falhar
- **Pro:** `maxDuration: 60` no código (já configurado) — recomendado para API + MongoDB
