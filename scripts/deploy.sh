#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if required environment variables are set
check_env_vars() {
    log "Checking environment variables..."
    
    required_vars=("DOCKER_IMAGE_TAG" "DOCKER_REGISTRY" "DOCKER_USERNAME")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    if [[ ! -f ".env" ]]; then
        error ".env file not found. Please create it with your configuration."
    fi
    
    log "Environment variables check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs/nginx backups nginx/ssl
    log "Directories created"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    # Pull the application image
    if ! docker pull "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/rbac-app:${DOCKER_IMAGE_TAG}"; then
        error "Failed to pull application image"
    fi
    
    # Pull other images
    docker-compose -f docker-compose.prod.yml pull nginx
    
    log "Images pulled successfully"
}

# Backup database if using external database
backup_database() {
    log "Creating database backup..."
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    if [[ -n "${DB_HOST}" && "${DB_HOST}" != "db" ]]; then
        timestamp=$(date +"%Y%m%d_%H%M%S")
        backup_file="./backups/backup_${timestamp}.sql"
        
        log "Creating backup from external database: ${DB_HOST}"
        if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > "$backup_file" 2>/dev/null; then
            log "Database backup created: $backup_file"
        else
            warn "Failed to create database backup (external database may not be accessible from EC2), continuing with deployment"
        fi
    else
        log "Using external database - backup should be managed by your database provider"
    fi
}

# Stop and remove old containers
cleanup_old_deployment() {
    log "Stopping and removing old containers..."
    
    # Stop services gracefully
    if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.prod.yml down --timeout 30
    fi
    
    # Remove unused images (keep last 3 versions)
    log "Cleaning up unused Docker images..."
    docker image prune -f
    
    log "Cleanup completed"
}

# Deploy new version
deploy_new_version() {
    log "Deploying new version..."
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    log "New version deployed"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "Up (healthy)"; then
            log "Services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    error "Services failed to become healthy within the timeout period"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait a bit for the app container to be fully ready
    sleep 10
    
    if docker exec rbac-app /main migrate up; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed - check database connectivity and credentials"
    fi
}

# Main deployment function
main() {
    log "Starting deployment process..."
    
    check_env_vars
    create_directories
    pull_images
    backup_database
    cleanup_old_deployment
    deploy_new_version
    wait_for_services
    run_migrations
    
    log "Deployment completed successfully!"
    log "Application is available at: http://$(curl -s ifconfig.me):80"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"
