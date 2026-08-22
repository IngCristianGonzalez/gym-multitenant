# Gym Multitenant - Sistema de gestión de gimnasios multiempresa

Sistema SaaS multiempresa para gestionar múltiples gimnasios desde una sola base de datos central,
con aislamiento por `empresa_id`.

## Stack
- **Monorepo**: Turborepo + npm workspaces
- **Backend**: NestJS 12 + TypeScript
- **Base de datos**: PostgreSQL 16 + Prisma ORM
- **Frontend**: React 18 + Vite + TailwindCSS
- **Auth**: JWT + Bcrypt

## Arquitectura
```
apps/
  api/      → Backend NestJS (API REST)
  web/      → Frontend React SPA
packages/
  api-types/ → Tipos y schemas Zod compartidos entre frontend y backend
```

## Puesta en marcha

### Con Docker (recomendado)
```bash
docker compose up -d
```
- API: http://localhost:3000
- Web: http://localhost:5173
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432

### Desarrollo local
```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:push       # Crear tablas en PostgreSQL
npm run db:seed       # Datos iniciales (opcional)
npm run dev           # Levanta api + web en paralelo
```

## Primer super admin
```bash
curl -X POST http://localhost:3000/api/auth/register-primer-admin \
  -H "Content-Type: application/json" \
  -d '{"nombreEmpresa":"Gym Demo","nit":"900123456","nombre":"Admin","email":"admin@gym.com","password":"secret123"}'
```

## Módulos
- Autenticación y multi-tenancy (aislamiento por empresa_id)
- Gestión de miembros
- Planes y facturación (PDF, numeración secuencial, IVA incluido)
- Inventario / Nevera (control de stock)
- Equipamiento (máquinas)
- Rutinas (periodos: día, semana, mes, quincena=15 días, personalizado)
- Configuración de campos por empresa
