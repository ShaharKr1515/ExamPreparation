FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_PATH=/data/exampreparation.db

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node backend ./backend
COPY --chown=node:node --from=build /app/dist ./dist

RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 3000
VOLUME ["/data"]

CMD ["npm", "start"]
