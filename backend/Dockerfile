# ——— Build stage ———
FROM node:20-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace root files needed for pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all packages (shared + backend) for workspace resolution
COPY shared/ ./shared/
COPY backend/ ./backend/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lunark/shared build
RUN pnpm --filter @lunark/api build

# ——— Production stage ———
FROM node:20-slim AS production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace root for pnpm to resolve workspace deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared dist (workspace dependency)
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/shared/dist/ ./shared/dist/

# Copy backend dist + package.json
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist/ ./backend/dist/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod --filter @lunark/api

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]
