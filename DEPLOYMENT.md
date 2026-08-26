# Guia de Despliegue - VPS / EC2 (Docker)

## Arquitectura

```
Internet → :80 → nginx (frontend estatico + proxy /api) → api:3000 (NestJS + Prisma) → postgres:5432
```

**Puertos expuestos:** Solo 80 (HTTP). Para HTTPS, agregar Certbot/Let's Encrypt despues.

> Nota: El deploy en Render + Neon sigue disponible; ver `DEPLOY.md`. Esta guia es para VPS/EC2 con Docker.

---

## Requisitos Previos

- Servidor VPS o EC2 con Ubuntu 22.04/24.04/26.04
- Minimo 1 GB de RAM (se recomienda 2 GB o crear swap de 2 GB)
- Volumen de disco minimo 8 GB (recomendado 20 GB para Docker)
- Acceso SSH como root o usuario con sudo
- IP publica del servidor
- Dominio apuntando al servidor (opcional pero recomendado)

---

## Paso 1: Preparar el Servidor

### 1.1 Instalar Docker

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

### 1.2 Crear Swap (si el servidor tiene menos de 2 GB de RAM)

```bash
# Crear archivo swap de 2 GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verificar
free -h
```

### 1.3 Expandir volumen EBS (solo AWS EC2)

Si la instancia EC2 tiene un volumen EBS pequeno (8 GB o menos):

1. **Parar la instancia** desde la consola AWS (EC2 > Instances > Stop)
2. **Expandir el volumen** (EC2 > Volumes > Modify volume > cambiar tamano a 20 GB)
3. **Iniciar la instancia** (EC2 > Instances > Start)
4. **Extender el filesystem** (Ubuntu lo hace automaticamente al reiniciar)

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
| `DB_PASSWORD` | Password fuerte para PostgreSQL (solo caracteres alfanumericos, sin +, /, =) |
| `JWT_SECRET` | Secreto JWT (minimo 32 caracteres, random) |
| `CORS_ORIGIN` | Dominio del frontend (ej: `https://gym.tudominio.com`) |

**Generar secrets seguros:**

```bash
openssl rand -hex 16      # DB password (sin caracteres especiales)
openssl rand -hex 32      # JWT secret
```

> **IMPORTANTE:** El `DB_PASSWORD` no debe contener caracteres especiales (+, /, =) ya que se usa tanto en el URL de PostgreSQL como en las variables de entorno de Docker. Usa `openssl rand -hex 16` en lugar de `-base64`.

---

## Paso 4: Construir e Iniciar

### Opcion A: Build en el servidor (si tiene suficiente RAM y disco)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Opcion B: Build local + subir imagenes (recomendado para servidores pequenos)

Si el servidor tiene menos de 2 GB de RAM o poco espacio, construir las imagenes localmente:

```bash
# Build localmente (en tu maquina de desarrollo)
docker build -f apps/api/Dockerfile -t gym-multitenant-api:latest .
docker build -f apps/web/Dockerfile.prod -t gym-multitenant-frontend:latest .

# Guardar como tar.gz
docker save gym-multitenant-api:latest | gzip > /tmp/gym-api.tar.gz
docker save gym-multitenant-frontend:latest | gzip > /tmp/gym-frontend.tar.gz

# Subir al servidor (una por una para ahorrar espacio)
scp /tmp/gym-frontend.tar.gz root@TU_IP:/tmp/
ssh root@TU_IP "gunzip -c /tmp/gym-frontend.tar.gz | docker load && rm /tmp/gym-frontend.tar.gz"

scp /tmp/gym-api.tar.gz root@TU_IP:/tmp/
ssh root@TU_IP "gunzip -c /tmp/gym-api.tar.gz | docker load && rm /tmp/gym-api.tar.gz"

# Levantar servicios en el servidor
ssh root@TU_IP "cd /opt/gym-multitenant && docker compose -f docker-compose.prod.yml up -d"
```

### Verificar servicios

```bash
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
sudo docker exec gym-api npx prisma db push --schema ./apps/api/prisma/schema.prisma

# Poblar datos iniciales (superadmin, gimnasio demo)
# Usar tsx en lugar de ts-node (evita problemas con ESM/CJS)
sudo docker exec -w /app/apps/api gym-api npx tsx prisma/seed.ts
```

---

## Paso 6: Configurar Security Group (solo AWS EC2)

Si usas EC2, asegurate de que el Security Group permite trafico HTTP:

1. **EC2 > Instances** > seleccionar la instancia
2. Pestaña **Security** > click en el **Security Group**
3. **Inbound rules** > **Edit inbound rules**
4. **Add rule**:
   - **Type**: HTTP
   - **Port range**: 80
   - **Source**: `0.0.0.0/0`
5. **Save rules**

---

## Paso 7: Verificar el Despliegue

```bash
# Test desde el servidor
curl http://localhost/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"email":"admin@gym.com","password":"secret123"}'

# Test desde tu maquina
curl http://TU_IP/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"email":"admin@gym.com","password":"secret123"}'
```

**Abrir en navegador:** `http://TU_IP_SERVIDOR`

Credenciales por defecto (del seed):
- Email: `admin@gym.com`
- Password: `secret123`

> **IMPORTANTE:** Cambiar la password del admin despues del primer login.

---

## Paso 8: Configurar HTTPS (Opcional pero Recomendado)

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
sudo docker exec -it gym-api sh

# Entrar al container de postgres
sudo docker exec -it gym-db psql -U gym -d gym_central

# Verificar swap
free -h
```

---

## Backup de Base de Datos

```bash
# Crear backup
sudo docker exec gym-db pg_dump -U gym gym_central > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260825.sql | sudo docker exec -i gym-db psql -U gym -d gym_central
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

### Error "no space left on device"
```bash
# Limpiar imagenes Docker no usadas
docker system prune -af --volumes

# Verificar espacio
df -h /
```

### Error OOM (Out of Memory) durante build
```bash
# Verificar swap
free -h

# Si no hay swap, crear uno
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### API no conecta a la base de datos
```bash
# Verificar que la URL de conexion no tiene caracteres especiales
# El DB_PASSWORD solo debe tener caracteres alfanumericos
cat .env | grep DB_PASSWORD

# Si tiene caracteres especiales (+, /, =), regenerar:
DB_PASS=$(openssl rand -hex 16)
```

---

## Notas de Despliegue en EC2

### Configuracion de la instancia EC2 usada

- **IP Publica:** 3.17.66.248
- **Tipo:** t3.micro (908 MB RAM)
- **Sistema:** Ubuntu 26.04 LTS
- **Volumen EBS:** 20 GB (expandido de 8 GB)
- **Swap:** 2 GB
- **Security Group:** launch-wizard-4 (puertos 22 y 80 abiertos)

### Correcciones aplicadas durante el deploy

1. **`apps/api/Dockerfile`**: Se agrego `npm run build --workspace=@gym/api-types` antes del build de la API para que los tipos compartidos se compilen correctamente.

2. **`apps/web/Dockerfile.prod`**: Se cambio `npm ci` por `npm install` y se agrego `npm run build --workspace=@gym/api-types` antes del build del frontend.

3. **`apps/api/prisma/seed.ts`**: Se corrigio el orden de creacion de datos: `frecuenciaRutina` se crea antes de `miembroRutina` para respetar la restriccion de clave foranea.

### Estrategia de deploy para instancias pequenas

Para instancias EC2 con poca RAM (< 2 GB) o poco disco (< 10 GB):

1. **Build local** de las imagenes Docker en tu maquina de desarrollo
2. **Subir como tar.gz** al servidor via SCP
3. **Cargar con docker load** (sin guardar el tar en disco)
4. **Levantar con docker compose** sin `--build`

Esto evita problemas de OOM y falta de espacio en el servidor.

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
