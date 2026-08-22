FROM node:22-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/api-types ./packages/api-types
COPY apps/web ./apps/web
RUN npm install
RUN npm run build --workspace=@gym/web

FROM nginx:alpine
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
