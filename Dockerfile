FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV DATABASE_PATH=/data/exampreparation.db

RUN npm run build

EXPOSE 3000

# SQLite data is stored in /data.
# Mount /data to a persistent host directory, e.g.:
# /mnt/user/appdata/exampreparation -> /data
CMD ["node", "backend/server.js"]