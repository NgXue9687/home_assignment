# ---- Stage 1: build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # all dependencies, including the Nest CLI and TypeScript
COPY . .
RUN npm run build               # compiles src/ to dist/

# ---- Stage 2: run ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev           # runtime dependencies only
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]