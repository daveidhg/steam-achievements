FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN ls -la dist

EXPOSE 5000

CMD ["node", "dist/src/index.js"]