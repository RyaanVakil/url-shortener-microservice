# url-shortener/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# We will create this start script later
CMD ["npm", "start"]