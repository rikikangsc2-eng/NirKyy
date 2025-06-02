FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ARG PORT=3000
EXPOSE ${PORT}

CMD ["npm", "run", "start"]
