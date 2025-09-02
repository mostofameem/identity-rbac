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

```
EC2_HOST=your-ec2-public-ip
EC2_USER=ubuntu
EC2_SSH_KEY=your-private-ssh-key-content
DB_HOST=your-postgres-host.amazonaws.com
DB_PORT=5432
DB_USER=rbac_user
DB_PASSWORD=your-secure-password
DB_NAME=rbac_db
DB_SSL_MODE=require
JWT_SECRET=your-jwt-secret-min-32-chars
HTTP_PORT=5001
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 3. Deploy (1 minute)

### Option A: Tag-Based Release (Recommended)
```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0
```

### Option B: Manual Deployment
1. Go to GitHub → Actions → "Deploy to AWS EC2"
2. Click "Run workflow"
3. Select branch and environment
4. Click "Run workflow"

### Option C: Push to Main (Auto-deploy disabled)
```bash
git add .
git commit -m "Deploy to production"
git push origin main
# Then create a tag for deployment
```

## 4. Verify Deployment

- Backend: `http://your-ec2-ip:5001/health-check`
- Frontend: `http://your-ec2-ip:80`
- Check GitHub Actions for deployment status

## Quick Commands

```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check status
cd /home/ubuntu/rbac-app && ./deployment/scripts/deploy.sh status

# View logs  
cd /home/ubuntu/rbac-app && ./deployment/scripts/deploy.sh logs

# Rollback
cd /home/ubuntu/rbac-app && ./deployment/scripts/deploy.sh rollback
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
curl http://localhost:5001/health-check  # Test backend
```

**Need help?** Check the full [DEPLOYMENT.md](docs/DEPLOYMENT.md) guide.

---

✅ **Total setup time: ~10 minutes**  
🔄 **Auto-deploy on every push to main branch**  
📊 **Built-in monitoring and health checks**
