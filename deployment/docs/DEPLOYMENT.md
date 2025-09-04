# RBAC Application - AWS EC2 Deployment Guide

This guide will help you deploy your RBAC application to AWS EC2 using Docker and GitHub Actions for CI/CD.

## 📋 Prerequisites

1. **AWS Account** with EC2 access
2. **GitHub Repository** for your code
3. **PostgreSQL Database** (AWS RDS, DigitalOcean, or any external provider)
4. **Domain name** (optional, for custom domain)
5. **SSH Key Pair** for EC2 access

## 🚀 Quick Start

### Step 0: Set Up PostgreSQL Database

Choose one of these options for your PostgreSQL database:

#### Option A: AWS RDS (Recommended for production)
1. **Create RDS PostgreSQL instance:**
   - Engine: PostgreSQL 15+
   - Instance class: db.t3.micro (free tier) or db.t3.small
   - Storage: 20GB+ SSD
   - Enable automated backups
   - Set master username and password
   - Note down the endpoint URL

2. **Configure security group:**
   - Allow inbound connections on port 5432 from your EC2 security group

#### Option B: DigitalOcean Managed Database
1. Create a PostgreSQL cluster
2. Note down connection details
3. Add your EC2 IP to trusted sources

#### Option C: Other providers
- Supabase, Neon, PlanetScale, or any PostgreSQL provider
- Ensure SSL connections are supported

### Step 1: Launch EC2 Instance

1. **Launch EC2 Instance:**
   - Instance Type: `t3.small` or `t3.medium` (minimum recommended)
   - OS: Ubuntu 22.04 LTS
   - Storage: 20GB+ SSD
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5001 (API)

2. **Connect to your instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Run the setup script:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/deployment/scripts/setup-ec2.sh | bash
   sudo reboot
   ```

### Step 2: Configure GitHub Secrets

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
```bash
# EC2 Connection
EC2_HOST=your-ec2-public-ip
EC2_USER=ubuntu
EC2_SSH_KEY=your-private-ssh-key-content

# External PostgreSQL Database Configuration
DB_HOST=your-postgres-host.amazonaws.com
DB_PORT=5432
DB_USER=rbac_user
DB_PASSWORD=your-secure-password
DB_NAME=rbac_db
DB_SSL_MODE=require

# Application Configuration
HTTP_PORT=5001
JWT_SECRET=your-jwt-secret-min-32-characters

# Mail Configuration (optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Step 3: Deploy

1. **Push your code to main/develop branch:**
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build Docker images
   - Deploy to your EC2 instance
   - Run health checks

## 🏗️ Architecture Overview

```
Internet → Nginx (Port 80/443) → Frontend (Port 80) + Backend API (Port 5001) → External PostgreSQL
```

### Components:
- **Frontend**: React app served by Nginx
- **Backend**: Go API server
- **Database**: External PostgreSQL (AWS RDS, DigitalOcean, etc.)
- **Reverse Proxy**: Nginx (load balancing, SSL termination)
- **Monitoring**: Health checks and basic monitoring

## 📁 Project Structure

```
RBAC/
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD
├── docker-compose.yml              # Development
├── deployment/                     # All deployment files
│   ├── docker-compose.prod.yml     # Production Docker Compose
│   ├── env.production.example      # Environment template
│   ├── scripts/
│   │   ├── deploy.sh               # Deployment script
│   │   └── setup-ec2.sh           # EC2 setup script
│   ├── nginx/
│   │   └── nginx.conf              # Nginx configuration
│   └── docs/
│       ├── DEPLOYMENT.md           # This guide
│       ├── DEPLOYMENT_QUICKSTART.md # Quick start guide
│       └── DATABASE_SETUP.md       # Database setup guide
```

## 🔧 Manual Deployment Commands

### On EC2 Instance:

```bash
# Check deployment status
cd /home/ubuntu/rbac-app
./deployment/scripts/deploy.sh status

# View logs
./deployment/scripts/deploy.sh logs

# Rollback to previous version
./deployment/scripts/deploy.sh rollback

# Stop services
./deployment/scripts/deploy.sh stop

# Manual deployment
./deployment/scripts/deploy.sh deploy
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoints:
- **Backend**: `http://your-server:5001/health-check`
- **Frontend**: `http://your-server:80`
- **Overall**: `http://your-server/health`

### Monitoring Script:
```bash
# Run monitoring check
/home/ubuntu/monitor.sh

# View monitoring logs
tail -f /home/ubuntu/logs/monitor.log
```

### Docker Commands:
```bash
# View running containers
docker ps

# View container logs
docker logs rbac-backend
docker logs rbac-frontend
docker logs rbac-mysql

# Container stats
docker stats

# System cleanup
docker system prune -f
```

## 🔒 Security Considerations

### Firewall (UFW):
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

### Environment Variables:
- Never commit `.env` files to version control
- Use strong passwords (minimum 16 characters)
- Rotate JWT secrets regularly
- Use app passwords for email services

### SSL/HTTPS Setup:
1. **Get SSL Certificate** (Let's Encrypt recommended):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Update nginx configuration** to enable SSL block

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Containers not starting:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory usage
free -h
```

#### 2. Database connection issues:
```bash
# Check backend logs for database connection errors
docker logs rbac-backend

# Test database connectivity from EC2
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

#### 3. Port conflicts:
```bash
# Check what's using ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5001
```

#### 4. GitHub Actions failing:
- Check repository secrets are set correctly
- Verify EC2 security group allows connections
- Check SSH key format (no extra spaces/newlines)

### Debug Commands:
```bash
# Test SSH connection
ssh -i your-key.pem ubuntu@your-ec2-ip "echo 'Connection successful'"

# Test backend health
curl -f http://your-ec2-ip:5001/health-check

# Test frontend
curl -f http://your-ec2-ip:80
```

## 📊 Performance Optimization

### For Production:
1. **Increase EC2 instance size** if needed
2. **Add Application Load Balancer** for high availability
3. **Use RDS** instead of containerized MySQL
4. **Add Redis** for session storage
5. **Implement log aggregation** (ELK stack or CloudWatch)

### Resource Limits:
```yaml
# In docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 🔄 Backup and Recovery

### Database Backup:
```bash
# Create backup (from your database provider)
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < backup_20241201.sql

# Note: Use your database provider's backup tools (AWS RDS automated backups, etc.)
```

### Application Backup:
Automatic backups are created before each deployment in `/home/ubuntu/backups/`

## 📞 Support

### Log Locations:
- Application logs: `/home/ubuntu/logs/`
- Docker logs: `docker logs <container-name>`
- System logs: `/var/log/syslog`
- Nginx logs: `/var/log/nginx/`

### Useful Commands:
```bash
# System status
systemctl status docker
systemctl status nginx

# Resource usage
htop
docker stats

# Network connectivity
ping google.com
curl -I http://your-domain.com
```

---

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring** (Prometheus + Grafana)
2. **Configure log aggregation** (ELK stack)
3. **Add SSL certificate** for HTTPS
4. **Set up automated backups**
5. **Configure domain name** and DNS
6. **Add staging environment**
7. **Set up alerts** for system failures

Happy Deploying! 🚀
