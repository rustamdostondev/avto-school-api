FROM node:22-alpine AS development
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm  cache clear --force
RUN npm install
RUN apk add libressl-dev
RUN apk add openssl

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

#ARG NODE_ENV=production
#ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./

RUN npm  cache clear --force
RUN npm install --legacy-peer-deps
RUN apk add libressl-dev
RUN apk add openssl

COPY . .

COPY --from=development /usr/src/app/dist ./dist
RUN npx prisma generate
CMD ["node", "dist/src/main.js"]