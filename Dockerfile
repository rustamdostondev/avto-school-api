FROM node:18-alpine AS development

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

ENV HUSKY=0

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM node:18-alpine AS production

# Install system dependencies for production
RUN apk add --no-cache \
    openssl \
    dumb-init

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV HUSKY=0

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install only production dependencies
RUN npm cache clean --force
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Copy other necessary files
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/src/main.js"]