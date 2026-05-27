# Entornos: desarrollo y producción

InternOri usa **dos ramas**, **dos proyectos Supabase** y **dos deploys en Vercel**.

| | Desarrollo | Producción |
|---|------------|------------|
| **Rama Git** | `develop` | `main` |
| **Supabase** | Proyecto `internori-dev` (o similar) | Proyecto `internori-prod` |
| **Deploy Vercel** | URL dev (ej. `internori-dev.vercel.app`) | URL prod (ej. `internori.vercel.app`) |
| **Datos** | Pruebas, resets permitidos | Datos reales del negocio |
| **`NEXT_PUBLIC_APP_ENV`** | `development` | `production` |

---

## 1. GitHub — ramas

```bash
# Ya en el repo local:
git checkout -b develop
git push -u origin develop
```

Flujo de trabajo:

1. Trabajá en `develop` (features, fixes, migraciones nuevas).
2. Cuando esté estable → **Pull Request** `develop` → `main`.
3. Merge a `main` solo cuando probaste en dev.

Opcional (recomendado en GitHub → Settings → Branches):

- Proteger `main`: requiere PR y que pase el lint.
- Permitir push directo solo a `develop`.

---

## 2. Supabase — dos proyectos

### Proyecto DEV (nuevo)

1. [supabase.com](https://supabase.com) → **New project** → nombre ej. `internori-dev`.
2. **SQL Editor** → ejecutá **una vez** el archivo `supabase/bootstrap.sql` (esquema completo, ~5 s).
   - Alternativa lenta: migraciones `001`…`021` una por una (no recomendado).
3. Copiá **Project URL** y **anon key** (Settings → API).

### Proyecto PROD (actual o nuevo)

- Si el proyecto actual es el que vas a usar en prod, dejalo como **prod**.
- Si creás prod nuevo, repetí las mismas migraciones ahí.
- **Nunca** corras `npm run db:reset` apuntando a prod.

### Migraciones nuevas (siempre este orden)

1. Crear archivo en `supabase/migrations/`.
2. Probar en **SQL Editor del proyecto DEV**.
3. Merge a `main` y aplicar el mismo SQL en **PROD**.

---

## 3. Vercel — dos deploys

1. Importá el repo `InternOri` en Vercel (si aún no está).
2. **Settings → Git**:
   - **Production Branch**: `main`
3. **Settings → Environments**:

### Production (`main`)

Variables (Environment: **Production**):

```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://XXXX-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AUTH_USERNAME=...
AUTH_PASSWORD=...
AUTH_SECRET=...   # distinto al de dev
```

**No** incluir `INVENTARIO_RESET_ALLOWED`.

### Preview / Development branch (`develop`)

Opción A (recomendada): en **Settings → Git → Preview Branches**, asegurate que `develop` genere deploy.

Asigná las mismas variables con Environment **Preview** (o solo la rama `develop` si Vercel lo permite por branch):

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://XXXX-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AUTH_USERNAME=...        # puede ser distinto a prod
AUTH_PASSWORD=...
AUTH_SECRET=...          # distinto a prod
INVENTARIO_RESET_ALLOWED=true   # solo si querés reset desde CI/local contra dev
```

4. Redeploy después de cambiar variables.

---

## 4. Local — `.env.local`

Para trabajar en tu máquina contra **DEV**:

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://TU-DEV.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

AUTH_USERNAME="..."
AUTH_PASSWORD="..."
AUTH_SECRET=...

INVENTARIO_RESET_ALLOWED=true
```

Copiá desde `.env.example` y reemplazá valores.

---

## 5. Comandos útiles

```bash
# Verificar variables obligatorias
npm run env:check

# Vaciar inventario (solo dev, con salvaguardas)
npm run db:reset
```

Si `db:reset` falla por permisos RLS, usá `supabase/scripts/reset-inventario-completo.sql` en el **SQL Editor del proyecto DEV** (nunca en prod).

---

## 6. Checklist rápido

- [ ] Rama `develop` en GitHub
- [ ] Proyecto Supabase DEV con migraciones aplicadas
- [ ] Proyecto Supabase PROD con migraciones aplicadas
- [ ] Vercel: `main` → prod, `develop` → dev
- [ ] Variables distintas por entorno en Vercel
- [ ] `.env.local` apunta a DEV
- [ ] Banner ámbar visible solo en dev (`NEXT_PUBLIC_APP_ENV=development`)

---

## 7. Qué no hacer

- No uses la misma `AUTH_SECRET` en dev y prod.
- No corras reset de inventario en prod.
- No merges migraciones a `main` sin probarlas antes en dev.
