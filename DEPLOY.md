# Deploy a Render + Neon (gratis)

Stack: NestJS API + React/Vite + PostgreSQL

---

## Paso 1 — Crear base de datos en Neon

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratis
2. Crea un nuevo proyecto (nombre: `gym-db`)
3. Copia el **Connection string** — se ve así:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/gym_central?sslmode=require
   ```
4. Ve a la pestaña **SQL Editor** de Neon y ejecuta:
   ```sql
   -- Crear schema public si no existe
   CREATE SCHEMA IF NOT EXISTS public;
   ```

> **Tip:** Guarda ese connection string, lo necesitas en el Paso 3.

---

## Paso 2 — Crear la API en Render

1. Ve a [render.com](https://render.com) y crea una cuenta gratis
2. **New +** → **Web Service**
3. Conecta tu repositorio de GitHub: `IngCristianGonzalez/gym-multitenant`
4. Configura:

| Campo | Valor |
|---|---|
| **Name** | `gym-api` |
| **Region** | Oregon (US West) o la más cercana |
| **Branch** | `main` |
| **Runtime** | `Docker` |
| **Dockerfile** | `apps/api/Dockerfile` |
| **Docker context** | `.` (punto, la raíz del repo) |
| **Port** | `3000` |
| **Plan** | `Free` |

5. En **Environment Variables** agrega:

| Key | Value |
|---|---|
| `DATABASE_URL` | *El connection string de Neon del Paso 1* |
| `JWT_SECRET` | *Genera uno seguro, ej: `gym-prod-$(openssl rand -hex 16)`* |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | *Lo completas en el Paso 4* |

6. Haz clic en **Create Web Service**
7. Espera a que el build termine (~2-3 min)
8. Copia la URL asignada — algo como:
   ```
   https://gym-api-xxxx.onrender.com
   ```

---

## Paso 3 — Correr las migraciones de Prisma

1. En Render, ve a tu servicio `gym-api`
2. Pestaña **Shell** (o **Manual Deploy** → **Clear build cache & deploy**)
3. Ejecuta:
   ```bash
   npx prisma migrate deploy --schema ./apps/api/prisma/schema.prisma
   ```
4. Si no hay migraciones, usa:
   ```bash
   npx prisma db push --schema ./apps/api/prisma/schema.prisma
   npx prisma generate --schema ./apps/api/prisma/schema.prisma
   ```

---

## Paso 4 — Crear el Frontend en Render

1. **New +** → **Web Service** (otro más)
2. Conecta el mismo repositorio
3. Configura:

| Campo | Valor |
|---|---|
| **Name** | `gym-web` |
| **Region** | Igual que la API |
| **Branch** | `main` |
| **Runtime** | `Docker` |
| **Dockerfile** | `apps/web/Dockerfile` |
| **Docker context** | `.` (punto) |
| **Port** | `80` |
| **Plan** | `Free` |

4. En **Environment Variables** agrega:

| Key | Value |
|---|---|
| `API_URL` | `https://gym-api-xxxx.onrender.com` *(la URL del Paso 2)* |

5. **Create Web Service**
6. Espera el build (~1-2 min)
7. Copia la URL — algo como:
   ```
   https://gym-web-xxxx.onrender.com
   ```

---

## Paso 5 — Configurar CORS

1. Ve al servicio `gym-api` en Render
2. **Environment** →编辑 `CORS_ORIGIN`
3. Pon la URL del frontend:
   ```
   https://gym-web-xxxx.onrender.com
   ```
4. Render hará un **auto-deploy** al cambiar env vars

---

## Paso 6 — Probar

1. Abre `https://gym-web-xxxx.onrender.com`
2. Deberías ver la pantalla de login
3. Credenciales por defecto:
   - Email: `admin@gym.com`
   - Contraseña: `secret123`

> **Nota:** Si no funciona, revisa los logs en Render → tu servicio → **Logs**

---

## Costo total: $0/mes

| Servicio | Plan | Costo |
|---|---|---|
| Neon PostgreSQL | Free | $0 |
| Render API | Free | $0 |
| Render Web | Free | $0 |
| **Total** | | **$0** |

---

## Limitaciones del plan gratuito

- **Render:** Los servicios se "duermen" tras 15 min sin tráfico. Al hacer request, tardan ~30-60s en despertar (cold start)
- **Neon:** 0.5GB de almacenamiento, 100 compute-hours/mes
- **Render Free:** 750 hrs/mes compartidas entre servicios

Para 3 usuarios que usan la app ocasionalmente, es más que suficiente.

---

## Variables de entorno de referencia

### API (`gym-api`)
```env
DATABASE_URL=postgresql://...    # Neon connection string
JWT_SECRET=tu-seguro-secreto     # Generar con: openssl rand -hex 32
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://gym-web-xxxx.onrender.com
```

### Web (`gym-web`)
```env
API_URL=https://gym-api-xxxx.onrender.com
```

---

## FAQ

**¿Por qué tarda en cargar la primera vez?**
El servicio se duerme tras 15 min de inactividad. La primera petición toma ~30-60s. Después responde normal.

**¿Cómo actualizo el código?**
Haz `git push` a `main`. Render detecta el cambio y hace auto-deploy.

**¿Cómo veo los logs?**
Render → tu servicio → pestaña **Logs**

**¿Cómo administro la base de datos?**
Neon tiene un SQL Editor integrado en el dashboard. No necesitas pgAdmin.
