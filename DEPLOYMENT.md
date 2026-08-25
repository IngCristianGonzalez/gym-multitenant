# Guia de Despliegue - VPS (Docker)

## Arquitectura

```
Internet → :80 → nginx (frontend estático + proxy /api) → api:3000 (NestJS + Prisma) → postgres:5432
```

**Puertos expuestos:** Solo 80 (HTTP). Para HTTPS, agregar Certbot/Let's Encrypt despues.

> Nota: El deploy en Render + Neon sigue disponible; ver `DEPLOY.md`. Esta guia es para VPS con Docker.

---

## Requisitos Previos

- Servidor VPS con Ubuntu 22.04/24.04
- Acceso SSH como root o usuario con sudo
- IP publica del servidor
- Dominio apuntando al servidor (opcional pero recomendado)

---

## Paso 1: Preparar el Servidor

```bash
# Conectar al servidor
ssh root@TU_IP_SERVIDOR

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar Docker Compose
docker compose version

# Habilitar Docker para inicio automatico
systemctl enable docker
systemctl start docker
```

---

## Paso 2: Clonar el Repositorio

```bash
mkdir -p /opt/gym-multitenant
cd /opt/gym-multitenant

git clone https://github.com/IngCristianGonzalez/gym-multitenant.git .

# Si el repositorio es privado, configura un token:
# git clone https://TU_TOKEN@github.com/IngCristianGonzalez/gym-multitenant.git .
```

---

## Paso 3: Configurar Variables de Entorno

```bash
# Copiar template
cp .env.production .env

# Editar con tus valores reales
nano .env
```

**Variables obligatorias a cambiar:**

| Variable | Descripcion |
|---|---|
| `DB_PASSWORD` | Password fuerte para PostgreSQL |
| `JWT_SECRET` | Secreto JWT (minimo 32 caracteres, random) |
| `CORS_ORIGIN` | Dominio del frontend (ej: `https://gym.tudominio.com`) |

**Generar secrets seguros:**

```bash
openssl rand -base64 32   # DB password
openssl rand -hex 32      # JWT secret
```

---

## Paso 4: Construir e Iniciar

```bash
# Construir imagenes y levantar servicios
docker compose -f docker-compose.prod.yml up -d --build

# Verificar que todos los servicios estan corriendo
docker compose -f docker-compose.prod.yml ps

# Ver logs de la API
docker compose -f docker-compose.prod.yml logs -f api

# Ver logs de nginx
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## Paso 5: Aplicar el Esquema de Base de Datos

El proyecto usa Prisma sin carpeta de migraciones, por lo que el esquema se aplica con `db push`:

```bash
# Crear las tablas segun schema.prisma
docker exec -w /app gym-api npx prisma db push --schema ./apps/api/prisma/schema.prisma

# Poblar datos iniciales (superadmin, gimnasio demo)
npm run db:seed --workspace=@gym/api  # solo en desarrollo local

# En el servidor, correr el seed dentro del contenedor:
docker exec -w /app/apps/api gym-api npx ts-node prisma/seed.ts
```

---

## Paso 6: Verificar el Despliegue

```bash
# Test health check (ajusta la ruta si tu API usa otra)
curl http://localhost/api
```

**Abrir en navegador:** `http://TU_IP_SERVIDOR`

Credenciales por defecto (del seed):
- Email: `admin@gym.com`
- Password: `secret123`

> **IMPORTANTE:** Cambiar la password del admin despues del primer login.

---

## Paso 7: Configurar HTTPS (Opcional pero Recomendado)

```bash
apt install -y certbot

# Detener nginx temporalmente
docker compose -f docker-compose.prod.yml stop frontend

# Obtener certificado (reemplaza con tu dominio)
certbot certonly --standalone -d gym.tudominio.com

# Copiar certificados al directorio del proyecto
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/gym.tudominio.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/gym.tudominio.com/privkey.pem nginx/ssl/
```

Despues, actualizar `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name gym.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name gym.tudominio.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # ... resto de la config igual
}
```

Y recargar:

```bash
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## Comandos Utiles

```bash
# Ver estado de servicios
docker compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar todo
docker compose -f docker-compose.prod.yml restart

# Reiniciar solo la API
docker compose -f docker-compose.prod.yml restart api

# Detener todo
docker compose -f docker-compose.prod.yml down

# Detener y eliminar volumenes (CUIDADO: borra la DB)
docker compose -f docker-compose.prod.yml down -v

# Reconstruir desde cero
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# Entrar al container de la API
docker exec -it gym-api sh

# Entrar al container de postgres
docker exec -it gym-db psql -U gym -d gym_central
```

---

## Backup de Base de Datos

```bash
# Crear backup
docker exec gym-db pg_dump -U gym gym_central > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260825.sql | docker exec -i gym-db psql -U gym -d gym_central
```

---

## Troubleshooting

### El frontend no carga
```bash
docker compose -f docker-compose.prod.yml logs frontend
curl http://localhost/api
```

### Error de conexion a base de datos
```bash
docker compose -f docker-compose.prod.yml logs postgres
```

### Puerto 80 ocupado
```bash
lsof -i :80
# Matar el proceso o cambiar el puerto en docker-compose.prod.yml
```

---

## Estructura de Archivos en el Servidor

```
/opt/gym-multitenant/
├── .env                          # Variables de entorno (NO commitear)
├── docker-compose.prod.yml       # Configuracion de produccion
├── apps/
│   ├── api/
│   │   ├── Dockerfile            # Multi-stage NestJS + Prisma
│   │   └── prisma/schema.prisma
│   └── web/
│       ├── Dockerfile.prod       # Multi-stage Vite + nginx
│       └── src/
├── packages/api-types/
└── nginx/
    ├── nginx.conf                # Proxy /api → api:3000
    └── ssl/                      # Certificados (opcional)
```
