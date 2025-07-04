FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY scripts/wait-for-db.sh ./scripts/wait-for-db.sh
RUN chmod +x ./scripts/wait-for-db.sh

EXPOSE 3000
CMD ["npm", "start"]
