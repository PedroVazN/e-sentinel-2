# Deploy na Vercel — e-Sentinel 2

Este projeto usa **um único deploy na Vercel**:

| Parte | Como funciona na Vercel |
|--------|-------------------------|
| **Frontend** | Build do Vite (`client/dist`) — arquivos estáticos |
| **Backend (API)** | Função serverless em `api/index.ts` (Express + MongoDB) |

As requisições para `/api/*` são encaminhadas para a API; o restante serve o React.

---

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) com cluster ativo
3. [Cloudinary](https://cloudinary.com) — **obrigatório na Vercel** (upload de imagens)
4. Repositório no GitHub (recomendado): `PedroVazN/e-sentinel-2`

### MongoDB Atlas — rede

Na Vercel as funções saem com IPs dinâmicos. No Atlas:

**Network Access → Add IP Address → `0.0.0.0/0`** (Allow from anywhere)

Use a URI com o host **primário** se `mongodb+srv` falhar no Windows (já documentado no `.env.example`).

---

## Variáveis de ambiente (Vercel)

No painel do projeto: **Settings → Environment Variables**

| Variável | Obrigatória | Exemplo / nota |
|----------|-------------|----------------|
| `MONGODB_URI` | Sim | URI do Atlas (com `directConnection=true` no shard primário, se necessário) |
| `CLOUDINARY_CLOUD_NAME` | Sim | Painel Cloudinary |
| `CLOUDINARY_API_KEY` | Sim | Painel Cloudinary |
| `CLOUDINARY_API_SECRET` | Sim | Painel Cloudinary |
| `CLOUDINARY_FOLDER` | Não | `esentinel2` |
| `CLIENT_URL` | Não | URL do deploy, ex: `https://seu-app.vercel.app` (CORS) |
| `NODE_ENV` | Não | `production` (a Vercel define automaticamente) |

Marque **Production**, **Preview** e **Development** para as variáveis sensíveis.

---

## Opção A — Deploy pelo GitHub (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `e-sentinel-2`
3. **Root Directory:** deixe vazio (raiz do monorepo)
4. A Vercel detecta `vercel.json` e usa:
   - **Install:** instala raiz + `server` + `client`
   - **Build:** compila API e frontend
   - **Output:** `client/dist`
5. Adicione as variáveis de ambiente acima
6. Clique em **Deploy**

Cada push em `main` gera um novo deploy automaticamente.

---

## Opção B — Deploy pela CLI

```powershell
cd c:\Users\Petória\Downloads\esentinel2
npm install -g vercel
vercel login
vercel
```

Na primeira vez, confirme o projeto e o diretório raiz.

Configure as variáveis (uma vez):

```powershell
vercel env add MONGODB_URI
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

Deploy em produção:

```powershell
vercel --prod
```

---

## Testar após o deploy

1. Abra `https://SEU-DOMINIO.vercel.app`
2. Health check: `https://SEU-DOMINIO.vercel.app/api/health`  
   Deve retornar `"status":"ok"` e `"db":"connected"`
3. Cadastre categoria e produto com imagem (Cloudinary)

---

## Desenvolvimento local (inalterado)

```powershell
copy server\.env.example server\.env
# Edite MONGODB_URI e Cloudinary
npm run dev
```

Abre em `http://localhost:4000` (frontend + API no mesmo processo).

---

## Dois projetos separados na Vercel (opcional)

Se quiser **frontend** e **API** em URLs diferentes:

### Projeto 1 — só frontend

- Root: `client`
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Variável: `VITE_API_URL=https://sua-api.vercel.app/api`  
  (seria necessário alterar `client/src/lib/api.ts` para usar `import.meta.env.VITE_API_URL`)

### Projeto 2 — só API

- Root: raiz do repo (onde está `api/` e `vercel.json`)
- Remover `outputDirectory` ou usar projeto só com rewrites para `/api`
- Mesmas variáveis de ambiente

**O setup atual (um projeto) é mais simples** — o frontend já chama `/api` no mesmo domínio.

---

## Limitações na Vercel

- **Timeout:** plano Hobby ~10s por função; Pro até 60s (`maxDuration` no `vercel.json`)
- **Uploads locais:** não persistem; use Cloudinary
- **Cold start:** primeira requisição pode demorar alguns segundos (conexão MongoDB)

---

## Solução de problemas

| Sintoma | Ação |
|---------|------|
| `503` Banco indisponível | Confira `MONGODB_URI`, IP `0.0.0.0/0` no Atlas, host primário na URI |
| Erro no upload de imagem | Configure todas as variáveis `CLOUDINARY_*` |
| Página em branco | Veja **Deployments → Build Logs**; o build do `client` deve concluir |
| API 404 | Confirme que `vercel.json` tem rewrite `/api/(.*)` → `/api` |

---

## Arquivos de deploy

- `vercel.json` — build, output e rewrites
- `api/index.ts` — entrada serverless da API
- `server/src/app.ts` — app Express reutilizável
- `.vercelignore` — ignora `.env` e `uploads`
