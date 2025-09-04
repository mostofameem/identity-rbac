# 🚀 RBAC Deployment - Quick Start

## Prerequisites Checklist
- [ ] AWS EC2 instance (t3.small+, Ubuntu 22.04)
- [ ] SSH key pair for EC2 access
- [ ] GitHub repository with your code
- [ ] PostgreSQL database (AWS RDS, DigitalOcean, etc.)
- [ ] Domain name (optional)

## 1. EC2 Setup (5 minutes)

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/deployment/scripts/setup-ec2.sh | bash

# Reboot
sudo reboot
```

## 2. GitHub Secrets Setup (3 minutes)

Go to `GitHub Repository > Settings > Secrets and variables > Actions` and add:

**Docker Hub:**
```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_password
```

**Server Access:**
```
SERVER_HOST=your-ec2-public-ip
SERVER_USER=ubuntu
SERVER_SSH_KEY=your-private-ssh-key-content
```

**Environment Variables (.env file on server):**
```
DB_HOST=your-postgres-host.amazonaws.com
DB_PORT=5432
DB_USER=rbac_user
DB_PASSWORD=your-secure-password
DB_NAME=rbac_db
JWT_SECRET=your-jwt-secret-min-32-chars
HTTP_PORT=5001
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 3. Deploy (1 minute)

### Tag-Based Automatic Deployment
```bash
# Create and push a release tag (triggers CI/CD automatically)
git tag v1.0.0
git push origin v1.0.0
```

**What happens automatically:**
1. 🏗️ Builds Docker images for backend & frontend
2. 📤 Pushes images to Docker Hub  
3. 🚀 SSHs to your server and deploys
4. ✅ Performs health checks

### Manual Deployment (Backup)
If CI/CD fails, SSH to your server:
```bash
ssh -i your-key.pem ubuntu@your-server-ip
cd /services/rbac
DOCKER_USERNAME=your_username TAG=v1.0.0 ./deploy.sh
```

## 4. Verify Deployment

- Backend: `http://your-ec2-ip:5001/health`
- Frontend: `http://your-ec2-ip:3000`
- Check GitHub Actions for deployment status

## Quick Commands

```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check status
cd /services/rbac && docker-compose ps

# View logs  
cd /services/rbac && docker-compose logs -f

# Manual deployment
cd /services/rbac && DOCKER_USERNAME=your_username TAG=v1.0.0 ./deploy.sh
```

## Troubleshooting

**Deployment fails?**
- Check GitHub repository secrets
- Verify EC2 security group allows ports 22, 80, 443, 5001
- Check SSH key format (no extra spaces)

**Services not responding?**
```bash
docker ps                    # Check running containers
docker logs rbac-backend     # Check backend logs
curl http://localhost:5001/health  # Test backend
curl http://localhost:3000   # Test frontend
```

**Need help?** Check the full [DEPLOYMENT.md](DEPLOYMENT.md) guide.

---

✅ **Total setup time: ~10 minutes**  
🔄 **Auto-deploy on tag creation (v1.0.0)**  
📊 **Built-in monitoring and health checks**  
🐳 **Docker Hub integration**
