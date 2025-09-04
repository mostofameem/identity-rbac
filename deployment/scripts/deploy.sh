#!/bin/bash

# Manual deployment script for RBAC application (Backup for CI/CD)
# This script is used for manual deployments when CI/CD is not available
set -e

echo "🚀 Starting manual deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/services/rbac"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/services/rbac/backups"

# Default values
DOCKER_USERNAME=${DOCKER_USERNAME:-""}
TAG=${TAG:-"latest"}

# Validate required environment variables
if [ -z "$DOCKER_USERNAME" ]; then
    print_error "DOCKER_USERNAME environment variable is required"
    echo "Usage: DOCKER_USERNAME=your_username TAG=v1.0.0 $0"
    exit 1
fi

# Create necessary directories
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR

echo "📋 Deployment Configuration:"
echo "   Docker Username: $DOCKER_USERNAME"
echo "   Tag: $TAG"
echo "   App Directory: $APP_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Checking $service_name service on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:$port/health-check > /dev/null 2>&1; then
            print_status "$service_name is healthy!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Backup current deployment
backup_current() {
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        print_status "Creating backup of current deployment..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        tar -czf "$BACKUP_DIR/rbac_backup_$TIMESTAMP.tar.gz" -C "$APP_DIR" . || true
        print_status "Backup created: rbac_backup_$TIMESTAMP.tar.gz"
        
        # Keep only last 5 backups
        cd $BACKUP_DIR
        ls -t rbac_backup_*.tar.gz | tail -n +6 | xargs -r rm
    fi
}

# Main deployment function
deploy() {
    print_status "Changing to application directory: $APP_DIR"
    cd $APP_DIR

    # Generate docker-compose.yml with the specified tag
    print_status "Generating docker-compose.yml with tag: $TAG"
    cat > docker-compose.yml <<EOL
services:
  backend:
    container_name: rbac-backend
    image: ${DOCKER_USERNAME}/rbac-backend:${TAG}
    env_file:
      - .env
    ports:
      - "\${HTTP_PORT}:\${HTTP_PORT}"
    networks:
      - rbac-network

  frontend:
    container_name: rbac-frontend
    image: ${DOCKER_USERNAME}/rbac-frontend:${TAG}
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - rbac-network

networks:
  rbac-network:
    driver: bridge
EOL

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true

    # Remove unused Docker resources
    print_status "Cleaning up Docker resources..."
    docker system prune -f || true

    # Pull latest Docker images from Docker Hub
    print_status "Pulling Docker images for tag: $TAG"
    docker-compose -f $DOCKER_COMPOSE_FILE pull

    # Start services
    print_status "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d

    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 15

    # Health checks
    print_status "Performing health checks..."
    
    # Check backend
    if check_service "Backend" "5001"; then
        print_status "✅ Backend service is running"
    else
        print_error "❌ Backend service failed to start"
        docker-compose -f $DOCKER_COMPOSE_FILE logs backend
        exit 1
    fi

    # Check frontend
    if curl -f -s http://localhost:80 > /dev/null 2>&1; then
        print_status "✅ Frontend service is running"
    else
        print_warning "⚠️  Frontend service might not be ready yet"
    fi

    print_status "🎉 Deployment completed successfully!"
    
    # Show running containers
    print_status "Running containers:"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
}

# Rollback function
rollback() {
    print_warning "Rolling back to previous version..."
    
    # Find the latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/rbac_backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        print_status "Restoring from backup: $(basename $LATEST_BACKUP)"
        
        # Stop current containers
        docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true
        
        # Restore backup
        cd $APP_DIR
        rm -rf *
        tar -xzf "$LATEST_BACKUP" -C .
        
        # Start services
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
        
        print_status "Rollback completed!"
    else
        print_error "No backup found for rollback"
        exit 1
    fi
}

# Script execution
case "${1:-deploy}" in
    "deploy")
        backup_current
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        cd $APP_DIR
        docker-compose -f $DOCKER_COMPOSE_FILE ps
        ;;
    "logs")
        cd $APP_DIR
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        ;;
    "stop")
        cd $APP_DIR
        docker-compose -f $DOCKER_COMPOSE_FILE down
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|logs|stop}"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Show container status"
        echo "  logs     - Show container logs"
        echo "  stop     - Stop all containers"
        exit 1
        ;;
esac
