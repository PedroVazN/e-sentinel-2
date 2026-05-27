# Deploy separado — `client` + `server`

Projeto dividido em **duas pastas independentes**:

```
esentinel2/
├── client/     → Frontend (React + Vite)
└── server/     → Backend (Express + MongoDB + API)
```

Cada pasta tem seu próprio `package.json` e `vercel.json`.

---

## 1. Backend — pasta `server`

> **Se der timeout 504 na Vercel:** use **Railway** ou **Render** para a API (Node contínuo).
> Na pasta `server/` existe `railway.toml` — deploy em [railway.app](https://railway.app) com Root `server`.

### Vercel

1. [vercel.com/new](https://vercel.com/new) → importe o repo
2. Nome: `esentinel2-api`
3. **Root Directory:** `server`
4. Deploy

> Se a Vercel reclamar `No Output Directory named "public"`, este repo já inclui `server/public/` para evitar esse erro. Mesmo assim, **o ideal** é deixar *Output Directory* vazio no painel e usar preset **Other**.

### Variáveis de ambiente (backend)

| Variável | Obrigatória |
|----------|-------------|
| `MONGODB_URI` | Sim |
| `CLOUDINARY_CLOUD_NAME` | Sim |
| `CLOUDINARY_API_KEY` | Sim |
| `CLOUDINARY_API_SECRET` | Sim |
| `CLIENT_URL` | Sim — URL do frontend (CORS) |

**Exemplo `CLIENT_URL`:**
```
https://esentinel2-web.vercel.app,http://localhost:5173
```

**MongoDB Atlas:** Network Access → `0.0.0.0/0`

### Testar

```
https://SUA-API.vercel.app/api/health
```

### Rodar local

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

API em `http://localhost:4000/api`

---

## 2. Frontend — pasta `client`

### Vercel

1. Novo projeto → mesmo repo
2. Nome: `esentinel2-web`
3. **Root Directory:** `client`
4. Deploy

### Variável de ambiente (frontend)

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://SUA-API.vercel.app/api` |

> Se mudar a URL da API, faça **Redeploy** do frontend.

### Rodar local

```powershell
cd client
copy .env.example .env
# VITE_API_URL=http://localhost:4000/api
npm install --include=dev
npm run dev
```

Frontend em `http://localhost:5173`

---

## Ordem de deploy

1. Deploy **server** (backend)
2. Copie a URL da API
3. Configure `VITE_API_URL` no **client**
4. Configure `CLIENT_URL` no **server** com URL do frontend
5. Deploy **client** (frontend)
6. Redeploy do backend se `CLIENT_URL` foi adicionada depois

---

## Desenvolvimento local (opcional — tudo junto)

Na raiz do repo:

```powershell
copy server\.env.example server\.env
npm run dev
```

Sobe backend + frontend compilado em `http://localhost:4000`.

---

## Resumo

| | Backend (`server`) | Frontend (`client`) |
|--|-------------------|---------------------|
| Root Directory Vercel | `server` | `client` |
| URL produção | `https://xxx-api.vercel.app/api` | `https://xxx-web.vercel.app` |
| Env principal | `MONGODB_URI`, `CLIENT_URL` | `VITE_API_URL` |
