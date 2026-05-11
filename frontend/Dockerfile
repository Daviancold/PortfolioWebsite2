FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npx tsc -p tsconfig.server.json

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone already contains minimal traced node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Compiled server and metrics
COPY --from=builder /app/dist ./dist

# next is incomplete in standalone when using a custom server
COPY --from=builder /app/node_modules/next ./node_modules/next
COPY --from=builder /app/node_modules/@next ./node_modules/@next

# prom-client and its transitive deps
COPY --from=builder /app/node_modules/prom-client ./node_modules/prom-client
COPY --from=builder /app/node_modules/tdigest ./node_modules/tdigest
COPY --from=builder /app/node_modules/bintrees ./node_modules/bintrees

EXPOSE 3000
EXPOSE 9090

CMD ["node", "dist/server.js"]