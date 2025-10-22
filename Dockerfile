# Multi-stage build for NestJS application

# Development stage
FROM node:18-alpine AS development

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

# Install system dependencies
RUN apk add --no-cache \
    libressl-dev \
    openssl \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN yarn prisma:generate

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

# Install system dependencies for production
RUN apk add --no-cache \
    libressl-dev \
    openssl \
    dumb-init \
    wget

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy other necessary files
COPY --chown=nestjs:nodejs . .

# Generate Prisma client for production
RUN yarn prisma:generate

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

# Expose port
EXPOSE 5001


# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/src/main.js"]
