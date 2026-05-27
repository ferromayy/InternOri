# InternOri

Dashboard de inventario productivo (café verde, tueste, packaging, producto terminado).

## Desarrollo local

```bash
cp .env.example .env.local
# Completá credenciales del proyecto Supabase DEV

npm install
npm run env:check
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Entornos (dev + prod)

Dos ramas, dos bases Supabase y dos deploys en Vercel:

| Rama | Entorno |
|------|---------|
| `develop` | Desarrollo |
| `main` | Producción |

Guía paso a paso: **[docs/entornos.md](docs/entornos.md)**

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor local |
| `npm run env:check` | Valida `.env.local` |
| `npm run db:reset` | Vacía inventario (**solo dev**) |
| `npm run lint` | ESLint |

## Stack

- Next.js (App Router)
- Supabase (PostgreSQL + RLS)
- Auth por sesión (`AUTH_*` en servidor)
