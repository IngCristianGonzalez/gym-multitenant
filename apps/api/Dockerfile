# Etapa de build
FROM node:22-bookworm-slim AS builder
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/api-types ./packages/api-types
COPY apps/api ./apps/api
RUN npm install
RUN npx prisma generate --schema ./apps/api/prisma/schema.prisma
RUN npm run build --workspace=@gym/api

# Etapa de producción
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/package.json ./package.json
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
