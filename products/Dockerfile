FROM node

WORKDIR /microservices/product

COPY package.json  .
RUN npm install
COPY tsconfig.json .
# Install TypeScript
RUN npm install -g typescript
RUN tsc 
RUN tsc -w

COPY . .
EXPOSE 6000

RUN ["npm","start"]