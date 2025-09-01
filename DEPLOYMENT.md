# 🚀 AWS EC2 Deployment Guide

This guide will help you set up a complete CI/CD pipeline for deploying your RBAC application to AWS EC2 using Docker and GitHub Actions.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [AWS EC2 Setup](#aws-ec2-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools & Accounts
- AWS Account with EC2 access
- GitHub repository with Actions enabled
- Docker Hub account (or other container registry)
- Domain name (optional, for HTTPS)
- SSH key pair for EC2 access

### Local Development Setup
- Docker & Docker Compose installed
- AWS CLI configured
- SSH client

## ☁️ AWS EC2 Setup

### 1. Launch EC2 Instance

```bash
# Recommended instance specifications:
# - Instance Type: t3.small (2 vCPU, 2 GB RAM) or larger (reduced since no local DB/Redis)
# - AMI: Ubuntu 22.04 LTS
# - Storage: 10 GB GP3 SSD (minimum, reduced since no local data storage)
# - Security Group: Allow ports 22, 80, 443
```

### 2. Security Group Configuration

Create a security group with the following inbound rules:

| Type  | Protocol | Port Range | Source    | Description           |
|-------|----------|------------|-----------|-----------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access            |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web traffic           |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web traffic    |

### 3. Connect to EC2 and Install Dependencies

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

### 4. Prepare Deployment Directory

```bash
# Reconnect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Create deployment directory
mkdir -p /home/ubuntu/rbac-deployment
cd /home/ubuntu/rbac-deployment

# Create necessary subdirectories
mkdir -p logs/nginx nginx/ssl

# Install PostgreSQL client tools (for database operations and health checks)
sudo apt install postgresql-client-common postgresql-client -y

# Install Redis client tools (for Redis health checks)
sudo apt install redis-tools -y
```

## 🔑 GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add the following secrets:

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUt...` |
| `AWS_REGION` | AWS region where EC2 is located | `us-east-1` |
| `EC2_HOST` | Public IP or domain of EC2 instance | `3.80.123.45` |
| `EC2_USER` | EC2 username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DOCKER_USERNAME` | Docker Hub username | `your-dockerhub-username` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_...` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications |
| `DOCKER_REGISTRY` | Alternative container registry (defaults to docker.io) |

## 🗄️ External Services Setup

Before configuring the environment, you need to set up external database and Redis services.

### Option 1: AWS Managed Services (Recommended)

#### AWS RDS (PostgreSQL)
```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
    --db-instance-identifier rbac-postgres \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password your-secure-password \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-your-security-group \
    --backup-retention-period 7 \
    --storage-encrypted
```

#### AWS ElastiCache (Redis)
```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id rbac-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --security-group-ids sg-your-security-group
```

### Option 2: Other Cloud Providers

- **DigitalOcean**: Managed PostgreSQL + Redis
- **Linode**: Managed Database + Redis
- **Google Cloud**: Cloud SQL + Memorystore
- **Azure**: Database for PostgreSQL + Cache for Redis

### Option 3: Third-Party Services

- **Database**: AWS RDS, PlanetScale, Neon, Supabase
- **Redis**: Redis Cloud, Upstash, AWS ElastiCache

### Security Group Configuration for External Services

Make sure your EC2 security group can access your external services:

```bash
# Allow outbound connections to your database (port 5432)
# Allow outbound connections to your Redis (port 6379)
# These are usually allowed by default in outbound rules
```

## ⚙️ Environment Configuration

### 1. Create Environment File on EC2

```bash
# Connect to EC2 and create .env file
ssh -i your-key.pem ubuntu@your-ec2-public-ip
cd /home/ubuntu/rbac-deployment

# Create .env file (copy from env.example and modify)
nano .env
```

### 2. Environment Variables Template

```bash
# External Database Configuration (AWS RDS, DigitalOcean, etc.)
DB_HOST=your-external-database-host.amazonaws.com
DB_PORT=5432
DB_NAME=rbac
DB_USER=postgres
DB_PASSWORD=your_very_secure_db_password_here

# External Redis Configuration (AWS ElastiCache, Redis Cloud, etc.)
REDIS_HOST=your-external-redis-host.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_very_secure_redis_password_here

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (for user invitations)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_FROM=your-email@gmail.com

# Application Configuration
APP_NAME=RBAC System
APP_URL=http://your-domain-or-ip.com
APP_ENV=production
LOG_LEVEL=info

# Docker Configuration
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your-dockerhub-username
DOCKER_IMAGE_TAG=latest
```

### 3. Secure the Environment File

```bash
# Set appropriate permissions
chmod 600 .env
chown ubuntu:ubuntu .env
```

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

1. **Push to deployment-dev branch**:
   ```bash
   git checkout -b deployment-dev
   git push origin deployment-dev
   ```

2. **Monitor GitHub Actions**:
   - Go to your repository's Actions tab
   - Watch the deployment pipeline progress
   - Check for any errors in the logs

### Manual Deployment

If you need to deploy manually:

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip
cd /home/ubuntu/rbac-deployment

# Pull latest changes (if files are updated)
# Copy docker-compose.prod.yml and scripts/ from your repository

# Set environment variables
export DOCKER_IMAGE_TAG=latest
export DOCKER_REGISTRY=docker.io
export DOCKER_USERNAME=your-dockerhub-username

# Run deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Run health check
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check application status
./scripts/health-check.sh

# View container logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### Database Backups

For external databases, backups should be managed by your database provider. However, you can still create manual backups:

```bash
# Create backup from external database
timestamp=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > ./backups/manual_backup_${timestamp}.sql

# List backups
ls -la ./backups/

# Note: Most managed database services provide automated backups:
# - AWS RDS: Automated backups with point-in-time recovery
# - DigitalOcean: Daily backups with 7-day retention
# - Google Cloud SQL: Automated backups and on-demand backups
```

### Log Management

```bash
# View application logs
docker logs rbac-app --tail=100 -f

# View nginx logs
docker logs rbac-nginx --tail=100 -f

# Clean old logs (run weekly)
docker system prune -f
```

### Updates and Scaling

```bash
# Update to specific version
export DOCKER_IMAGE_TAG=v1.2.3
./scripts/deploy.sh

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

## 🔒 Security Best Practices

### 1. SSL/HTTPS Setup (Recommended)

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Update nginx configuration to use HTTPS
# Uncomment HTTPS server block in nginx/nginx.conf
```

### 2. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### 3. Regular Security Updates

```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Deployment Fails

```bash
# Check GitHub Actions logs
# Common causes:
# - Invalid secrets
# - EC2 connectivity issues
# - Docker image build failures

# Debug on EC2:
docker-compose -f docker-compose.prod.yml logs
```

#### 2. Application Won't Start

```bash
# Check container logs
docker logs rbac-app

# Common causes:
# - Database connection issues
# - Missing environment variables
# - Port conflicts

# Verify environment variables
docker exec rbac-app env | grep -E "(DB_|JWT_|MAIL_)"
```

#### 3. Database Issues

```bash
# Test external database connection
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT version();"

# Check database connectivity from application
docker exec rbac-app /main health-check

# Run migrations manually
docker exec rbac-app /main migrate up

# Common external database issues:
# - Security group rules blocking access
# - Incorrect credentials in .env file
# - Database not publicly accessible (if needed)
# - SSL/TLS configuration issues
```

#### 4. Network Issues

```bash
# Check container network
docker network ls
docker network inspect rbac-deployment_rbac-network

# Test connectivity between containers
docker exec rbac-app ping db
docker exec rbac-app ping redis
```

### Performance Optimization

#### 1. Resource Monitoring

```bash
# Monitor resource usage
docker stats

# System resources
htop
df -h
free -m
```

#### 2. Database Optimization

```bash
# Monitor database performance
docker exec rbac-postgres pg_stat_activity

# Optimize queries
docker exec rbac-postgres pg_stat_statements
```

### Recovery Procedures

#### 1. Rollback Deployment

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
export DOCKER_IMAGE_TAG=previous-working-tag
./scripts/deploy.sh
```

#### 2. Restore Database

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Restore from backup
docker exec -i rbac-postgres psql -U postgres -d rbac < ./backups/backup_20240101_120000.sql

# Start application
docker-compose -f docker-compose.prod.yml start app
```

## 📞 Support

For additional support:

1. Check application logs: `docker logs rbac-app`
2. Run health check: `./scripts/health-check.sh`
3. Review this documentation
4. Check GitHub Actions workflow logs
5. Verify AWS EC2 instance status

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**⚠️ Important Notes:**

1. Always test deployments in a staging environment first
2. Keep your secrets secure and rotate them regularly
3. Monitor your application and infrastructure regularly
4. Backup your data regularly
5. Keep your dependencies updated for security

**🎉 Congratulations!** Your RBAC application should now be successfully deployed and running on AWS EC2 with a complete CI/CD pipeline!
