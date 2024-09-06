FROM node
WORKDIR /app
COPY package*.json /app
RUN npm install
COPY . /app
RUN npm run build
EXPOSE 6000
CMD ["npm", "run","start"]

