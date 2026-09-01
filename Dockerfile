FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# The SQLite DB lives at ./data/exampreparation.db by default. To persist it across
# container rebuilds (Docker/Unraid), mount a volume there and/or set DATABASE_PATH, e.g.:
#   -v /path/to/data:/app/data        or        -e DATABASE_PATH=/data/app.db
CMD ["node", "backend/server.js"]