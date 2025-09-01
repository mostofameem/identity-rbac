#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if container is running
check_container_status() {
    local container_name=$1
    local service_name=$2
    
    if docker ps -q -f name="$container_name" | grep -q .; then
        log "$service_name container is running"
        return 0
    else
        error "$service_name container is not running"
        return 1
    fi
}

# Check container health
check_container_health() {
    local container_name=$1
    local service_name=$2
    
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-healthcheck")
    
    case $health_status in
        "healthy")
            log "$service_name is healthy"
            return 0
            ;;
        "unhealthy")
            error "$service_name is unhealthy"
            return 1
            ;;
        "starting")
            warn "$service_name is still starting"
            return 1
            ;;
        "no-healthcheck")
            warn "$service_name has no health check configured"
            return 0
            ;;
        *)
            warn "$service_name health status unknown: $health_status"
            return 1
            ;;
    esac
}

# Check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service_name=$2
    local expected_status=${3:-200}
    
    info "Checking $service_name endpoint: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "$service_name endpoint is responding correctly (HTTP $response)"
        return 0
    else
        error "$service_name endpoint check failed (HTTP $response)"
        return 1
    fi
}

# Check database connection
check_database() {
    info "Checking external database connection..."
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    if [[ -n "${DB_HOST}" ]]; then
        if PGPASSWORD="${DB_PASSWORD}" pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
            log "External database is accepting connections (${DB_HOST}:${DB_PORT})"
            return 0
        else
            error "External database connection failed (${DB_HOST}:${DB_PORT})"
            return 1
        fi
    else
        warn "No database host configured in environment"
        return 1
    fi
}

# Check Redis connection
check_redis() {
    info "Checking external Redis connection..."
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    if [[ -n "${REDIS_HOST}" ]]; then
        if redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1; then
            log "External Redis is responding (${REDIS_HOST}:${REDIS_PORT})"
            return 0
        else
            error "External Redis connection failed (${REDIS_HOST}:${REDIS_PORT})"
            return 1
        fi
    else
        warn "No Redis host configured in environment"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    info "Checking disk space..."
    
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        log "Disk space is adequate (${disk_usage}% used)"
        return 0
    elif [ "$disk_usage" -lt 90 ]; then
        warn "Disk space is getting low (${disk_usage}% used)"
        return 0
    else
        error "Disk space is critically low (${disk_usage}% used)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    info "Checking memory usage..."
    
    memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$memory_usage" -lt 80 ]; then
        log "Memory usage is normal (${memory_usage}% used)"
        return 0
    elif [ "$memory_usage" -lt 90 ]; then
        warn "Memory usage is high (${memory_usage}% used)"
        return 0
    else
        error "Memory usage is critically high (${memory_usage}% used)"
        return 1
    fi
}

# Check application logs for errors
check_application_logs() {
    info "Checking application logs for errors..."
    
    # Check for recent errors in the last 5 minutes
    error_count=$(docker logs rbac-app --since=5m 2>&1 | grep -i "error\|fatal\|panic" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        log "No recent errors found in application logs"
        return 0
    elif [ "$error_count" -lt 5 ]; then
        warn "Found $error_count recent errors in application logs"
        return 0
    else
        error "Found $error_count recent errors in application logs"
        return 1
    fi
}

# Get application version
get_application_version() {
    info "Getting application version..."
    
    version=$(docker exec rbac-app /main version 2>/dev/null || echo "unknown")
    log "Application version: $version"
}

# Main health check function
main() {
    log "Starting comprehensive health check..."
    
    local exit_code=0
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Container status checks (only for local containers)
    check_container_status "rbac-app" "Application" || exit_code=1
    check_container_status "rbac-nginx" "Nginx" || exit_code=1
    
    # Health checks (only for local containers)
    check_container_health "rbac-app" "Application" || exit_code=1
    check_container_health "rbac-nginx" "Nginx" || exit_code=1
    
    # Service connectivity checks
    check_database || exit_code=1
    check_redis || exit_code=1
    
    # HTTP endpoint checks
    check_http_endpoint "http://localhost/health" "Nginx Proxy" || exit_code=1
    check_http_endpoint "http://localhost:5001/health" "Application Direct" || exit_code=1
    
    # System resource checks
    check_disk_space || exit_code=1
    check_memory || exit_code=1
    
    # Application-specific checks
    check_application_logs || exit_code=1
    get_application_version
    
    # Summary
    echo ""
    if [ $exit_code -eq 0 ]; then
        log "✅ All health checks passed successfully!"
        log "🚀 Application is healthy and ready to serve traffic"
    else
        error "❌ Some health checks failed. Please check the logs above."
        error "🔧 Manual intervention may be required"
    fi
    
    echo ""
    info "Health check completed at $(date)"
    
    exit $exit_code
}

# Run main function
main "$@"
