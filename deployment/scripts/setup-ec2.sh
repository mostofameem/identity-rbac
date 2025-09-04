#!/bin/bash

# EC2 Instance Setup Script for RBAC Application
# Run this script on your fresh EC2 instance to prepare it for deployment

set -e

echo "🔧 Setting up EC2 instance for RBAC application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
print_status "Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
print_status "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.24.0"
sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
print_status "Installing additional tools..."
sudo apt-get install -y curl wget git unzip htop nginx

# Create application directory
print_status "Creating application directories..."
mkdir -p /home/ubuntu/rbac-app
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/logs

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/rbac-app > /dev/null <<EOF
/home/ubuntu/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
EOF

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 5001    # Backend API
sudo ufw --force enable

# Create swap file (recommended for small instances)
print_status "Creating swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Set up monitoring script
print_status "Setting up monitoring script..."
tee /home/ubuntu/monitor.sh > /dev/null <<'EOF'
#!/bin/bash
# Simple monitoring script for RBAC application

LOG_FILE="/home/ubuntu/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if containers are running
BACKEND_STATUS=$(docker ps --filter "name=rbac-backend" --format "{{.Status}}" | head -1)
FRONTEND_STATUS=$(docker ps --filter "name=rbac-frontend" --format "{{.Status}}" | head -1)

# Check service health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health-check || echo "000")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")

# Log status
echo "[$DATE] Backend: $BACKEND_STATUS (HTTP: $BACKEND_HEALTH)" >> $LOG_FILE
echo "[$DATE] Frontend: $FRONTEND_STATUS (HTTP: $FRONTEND_HEALTH)" >> $LOG_FILE

# Alert if services are down
if [[ "$BACKEND_HEALTH" != "200" ]] || [[ "$FRONTEND_HEALTH" != "200" ]]; then
    echo "[$DATE] WARNING: Some services are not responding properly" >> $LOG_FILE
fi
EOF

chmod +x /home/ubuntu/monitor.sh

# Set up cron job for monitoring
print_status "Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/monitor.sh") | crontab -

# Create environment file template
print_status "Creating environment file template..."
tee /home/ubuntu/rbac-app/.env.example > /dev/null <<EOF
# External PostgreSQL Database Configuration
DB_HOST=your-postgres-host.amazonaws.com
DB_PORT=5432
DB_USER=rbac_user
DB_PASSWORD=your_secure_password
DB_NAME=rbac_db
DB_SSL_MODE=require

# Application Configuration
HTTP_PORT=5001
JWT_SECRET=your_jwt_secret_key_here

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
EOF

# Create health check endpoint script
print_status "Creating health check script..."
tee /home/ubuntu/health-check.sh > /dev/null <<'EOF'
#!/bin/bash
# Health check script for load balancers

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health-check)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "Backend: Healthy"
    exit 0
else
    echo "Backend: Unhealthy (HTTP: $BACKEND_HEALTH)"
    exit 1
fi
EOF

chmod +x /home/ubuntu/health-check.sh

# Set up Docker daemon configuration
print_status "Configuring Docker daemon..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply configuration
sudo systemctl restart docker

# Enable Docker to start on boot
sudo systemctl enable docker

print_status "✅ EC2 instance setup completed!"
print_status "📝 Next steps:"
echo "1. Copy your .env file to /home/ubuntu/rbac-app/.env"
echo "2. Set up your GitHub repository secrets"
echo "3. Push code to trigger deployment"
echo ""
print_warning "⚠️  Please reboot the instance to ensure all changes take effect:"
echo "sudo reboot"
