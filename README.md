# 🚀 NestJS Enterprise Starter Template

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A production-ready <a href="http://nestjs.com" target="_blank">NestJS</a> starter template with enterprise-grade features including authentication, authorization, file management, queue processing, and real-time communication.</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node Version" />
  <img src="https://img.shields.io/badge/typescript-%5E5.0-blue.svg" alt="TypeScript Version" />
</p>

## ✨ Features

### 🔐 **Authentication & Authorization**

- **JWT Authentication** with access & refresh tokens
- **Google OAuth 2.0** integration
- **Role-Based Access Control (RBAC)** with permissions
- **Password Reset** with email OTP verification
- **Session Management** with Redis
- **Rate Limiting** and user blocking for security

### 📧 **Email System**

- **Nodemailer** integration with Handlebars templates
- **OTP Verification** for password reset
- **Email Templates** for various notifications
- **Email Encoding** for privacy protection

### 📁 **File Management**

- **MinIO** integration for object storage
- **File Upload/Download** with progress tracking
- **Download History** tracking
- **Secure File Access** with authentication

### ⚡ **Queue Processing**

- **Bull Queue** with Redis for background jobs
- **Step-by-Step Processing** with status tracking
- **Website Crawling** capabilities
- **Job Management** with retry mechanisms
- **Real-time Progress** updates via WebSockets

### 🔄 **Real-time Communication**

- **WebSocket Gateway** with Socket.IO
- **Redis Adapter** for horizontal scaling
- **Real-time Notifications** and updates
- **Authentication** for WebSocket connections

### 🗄️ **Database & ORM**

- **Prisma ORM** with PostgreSQL
- **Database Migrations** and seeding
- **Type-safe** database operations
- **Connection Pooling** and optimization

### 🛠️ **Developer Experience**

- **TypeScript** with strict configuration
- **ESLint & Prettier** for code formatting
- **Husky** pre-commit hooks
- **Swagger/OpenAPI** documentation
- **Jest** testing framework
- **Docker** support

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 13
- **Redis** >= 6.0
- **MinIO** (for file storage)
- **Yarn** package manager

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd nest-template
yarn install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Generate Prisma client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# Seed database (optional)
yarn prisma:seed
```

### 4. Start Development Server

```bash
yarn start:dev
```

The API will be available at `http://localhost:5001`

## 📁 Project Structure

```
src/
├── common/                 # Shared modules and utilities
│   ├── constants/         # Application constants
│   ├── decorators/        # Custom decorators
│   ├── dto/              # Common DTOs
│   ├── gateway/          # WebSocket gateway
│   ├── logger/           # Logging service
│   ├── mail/             # Email service and templates
│   └── redis/            # Redis configuration
├── config/               # Configuration files
├── guards/               # Authentication guards
├── modules/              # Feature modules
│   ├── auth/            # Authentication & authorization
│   ├── files/           # File management
│   ├── queue/           # Background job processing
│   ├── roles/           # Role & permission management
│   └── users/           # User management
├── prisma/              # Database client
└── utils/               # Utility functions
```

## 🔧 Available Scripts

### Development

```bash
yarn start:dev          # Start in watch mode
yarn start:debug        # Start with debugging
yarn build              # Build for production
yarn start:prod         # Start production server
```

### Database

```bash
yarn prisma:generate    # Generate Prisma client
yarn prisma:migrate     # Run database migrations
yarn prisma:seed        # Seed database with initial data
yarn prisma:studio      # Open Prisma Studio
yarn prisma:rollback    # Reset database
```

### Code Quality

```bash
yarn lint               # Run ESLint with auto-fix
yarn lint:check         # Check linting without fixing
yarn format             # Format code with Prettier
yarn format:check       # Check code formatting
```

### Testing

```bash
yarn test               # Run unit tests
yarn test:watch         # Run tests in watch mode
yarn test:cov           # Run tests with coverage
yarn test:e2e           # Run end-to-end tests
```

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# JWT
JWT_ACCESS_TOKEN_SECRET=your-access-token-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret
JWT_ACCESS_TOKEN_EXPIRATION=10h
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: `http://localhost:5001/api/docs`
- **API JSON**: `http://localhost:5001/api/docs-json`

## 🔐 Authentication Flow

### 1. Register/Login

```bash
POST /auth/register
POST /auth/login
POST /auth/google
```

### 2. Token Management

```bash
POST /auth/refresh       # Refresh access token
POST /auth/logout        # Logout and invalidate tokens
```

### 3. Password Reset

```bash
POST /auth/forgot-password    # Request password reset
POST /auth/verify-reset-code  # Verify OTP code
POST /auth/reset-password     # Reset password
```

## 🏗️ Architecture Patterns

### **Modular Architecture**

- Feature-based modules with clear boundaries
- Shared common utilities and services
- Dependency injection throughout

### **RBAC (Role-Based Access Control)**

- Users have roles (user, admin, super_admin)
- Roles have permissions (read, write, delete, etc.)
- Resource-based permission checking

### **Queue Processing**

- Background job processing with Bull
- Step-by-step execution with progress tracking
- Retry mechanisms and error handling

### **Real-time Updates**

- WebSocket integration for live updates
- Redis adapter for scaling across instances
- Authenticated WebSocket connections

## 🛡️ Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **CORS** configuration
- **Helmet** for security headers
- **Input Validation** with class-validator
- **SQL Injection** protection via Prisma

## 🐳 Docker Deployment

This project is fully dockerized for easy deployment and development. The Docker setup includes multi-stage builds for optimized production images.

### Quick Docker Setup

#### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Make sure to set DATABASE_URL, REDIS_HOST, and other required variables
```

#### 2. Build and Run with Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

#### 3. Manual Docker Commands

**Build Images:**

```bash
# Build production image
docker build -t nestjs-app .
```

**Run Containers:**

```bash
# Run production container
docker run -p 5001:5001 --env-file .env nestjs-app
```

### Docker Architecture

#### Multi-Stage Build

- **Development Stage**: Used for building the application with all dependencies
- **Production Stage**: Optimized final image with only production dependencies and built application

#### Security Features

- Non-root user (`nestjs`) for running the application
- Minimal Alpine Linux base image
- Only necessary system dependencies included
- Proper signal handling with `dumb-init`

#### Health Checks

- Built-in health endpoint at `/health`
- Docker health check configuration
- Automatic container restart on failure

### Container Configuration

#### Environment Variables

The container accepts all the same environment variables as the local setup:

```env
# Required for external services
DATABASE_URL=postgresql://user:pass@external-db:5432/dbname
REDIS_HOST=external-redis-host
REDIS_PORT=6379

# Application secrets
JWT_ACCESS_TOKEN_SECRET=your-secret
JWT_REFRESH_TOKEN_SECRET=your-secret

# Optional services
MINIO_ENDPOINT=external-minio-host
MAIL_HOST=smtp.gmail.com
```

#### Volumes

- **Logs**: `./logs:/usr/src/app/logs` (optional)

#### Ports

- **Application**: `5001` (configurable via PORT env var)

### External Services Required

Since this Docker setup only includes the NestJS application, you'll need to provide:

#### 🗄️ **PostgreSQL Database**

```bash
# Example external database connection
DATABASE_URL="postgresql://username:password@your-db-host:5432/your-database"
```

#### 🔄 **Redis Server**

```bash
# Example external Redis connection
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### 📁 **MinIO/S3 Storage** (Optional)

```bash
# Example external MinIO connection
MINIO_ENDPOINT=your-minio-host
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

### Production Deployment

#### Using Docker Compose

1. Set up external services (PostgreSQL, Redis, MinIO)
2. Configure environment variables in `.env`
3. Deploy with `docker-compose up -d`

#### Using Container Orchestration

```yaml
# Kubernetes example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nestjs-app
  template:
    metadata:
      labels:
        app: nestjs-app
    spec:
      containers:
        - name: nestjs-app
          image: your-registry/nestjs-app:latest
          ports:
            - containerPort: 5001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure external PostgreSQL database
- [ ] Set up external Redis server
- [ ] Configure MinIO/S3 storage (if using file features)
- [ ] Set strong JWT secrets
- [ ] Configure email service (SMTP)
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (Nginx/Traefik)
- [ ] Set up SSL certificates
- [ ] Configure container orchestration (Kubernetes/Docker Swarm)
- [ ] Set up CI/CD pipeline
- [ ] Configure backup strategies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Bull](https://github.com/OptimalBits/bull) - Premium Queue package
- [Socket.IO](https://socket.io/) - Real-time communication
