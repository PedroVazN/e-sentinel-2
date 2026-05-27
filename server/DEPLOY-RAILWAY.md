# API com DADOS REAIS — Railway (recomendado)

A Vercel (serverless) no plano grátis **não consegue** conectar no MongoDB a tempo (timeout 10s).
Para **dados reais** do dashboard, use **Railway**:

## Passo a passo (5 min)

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. **New Project** → **Deploy from GitHub repo** → `e-sentinel-2`
3. **Settings** → **Root Directory** → `server`
4. **Variables** (copie do seu `server/.env`):
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_FOLDER`
   - `CLIENT_URL` = URL do seu frontend Vercel
5. Deploy automático
6. Copie a URL pública (ex: `https://esentinel2-production.up.railway.app`)

## Testar dados reais

- `https://SUA-URL.up.railway.app/api/dashboard` → JSON com `totals`, produtos, etc.
- Abra a URL raiz → página mostra KPIs reais

## Frontend (Vercel)

No projeto **client**, variável:

```
VITE_API_URL=https://SUA-URL.up.railway.app/api
```

Redeploy do frontend.

## MongoDB Atlas

- Network Access: `0.0.0.0/0`
- Região do cluster: **South America (São Paulo)** se possível
