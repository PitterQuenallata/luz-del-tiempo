FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4100
USER node
CMD ["node_modules/.bin/tsx", "src/index.ts"]
