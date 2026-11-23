FROM node:22-alpine
WORKDIR /app

RUN corepack enable
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4100
USER node
CMD ["node_modules/.bin/tsx", "src/index.ts"]
