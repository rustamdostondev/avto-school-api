#!/bin/bash

# Deployment script for avto-school-api
# This script is executed on the production server via SSH

set -e  # Exit on any error

APP_NAME="avto-school-api"
DOCKER_IMAGE="${DOCKERHUB_USER}/${APP_NAME}:latest"
APP_DIR="${APP_DIRECTORY:-/opt/avto-school-api}"

echo "🚀 Starting deployment for ${APP_NAME}..."

# Navigate to application directory
cd "${APP_DIR}"

echo "📥 Pulling latest code changes..."
git pull origin main

echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

echo "📦 Pulling latest Docker image: ${DOCKER_IMAGE}..."
docker pull "${DOCKER_IMAGE}"

echo "🔄 Starting services with new image..."
docker-compose up -d

echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "📊 Current running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "✅ Deployment completed successfully!"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Basic health check
if command -v curl &> /dev/null; then
    echo "🏥 Performing health check..."
    if curl -f "http://localhost:${APP_PORT:-5001}/health" &> /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but deployment completed"
    fi
fi
