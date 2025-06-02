FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install pm2 -g && npm ci --omit=dev

COPY . .

RUN pm2 install pm2-logrotate && pm2 set pm2-logrotate:max_size 5M

ARG PORT=3000
EXPOSE ${PORT}

ENV PM2_PUBLIC_KEY=t467p910r7kyg3q
ENV PM2_SECRET_KEY=lkltkk7omprw8ri
ENV PM2_NAME=app

CMD ["pm2-runtime", "start", "npm", "--name", "app", "--", "run", "start", "--max-memory-restart", "400M"]