FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci && npm --prefix backend ci

COPY prisma ./prisma
RUN npx prisma generate

COPY backend ./backend

EXPOSE 4000

CMD ["node", "backend/server.js"]
