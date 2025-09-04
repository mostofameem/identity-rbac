# 🚀 RBAC Deployment

This folder contains deployment files and documentation for the RBAC application with **automated CI/CD pipeline**.

## 🎯 Deployment Overview

**Primary Method**: Automated CI/CD with GitHub Actions (tag-based)
**Backup Method**: Manual deployment scripts in this folder

## 📁 Folder Structure

```
deployment/
├── README.md                      # This file
├── docker-compose.prod.yml        # Production Docker Compose template
├── env.production.example         # Environment variables template
├── scripts/
│   ├── deploy.sh                  # Manual deployment script (backup)
│   └── setup-ec2.sh              # EC2 instance setup script
└── docs/
    ├── DEPLOYMENT.md              # Complete deployment guide
    ├── DEPLOYMENT_QUICKSTART.md   # Quick start guide
    ├── TAG_BASED_DEPLOYMENT.md    # CI/CD workflow guide
    └── DATABASE_SETUP.md          # PostgreSQL database setup
```

## 📖 Documentation

### Quick Start (10 minutes)
- **[DEPLOYMENT_QUICKSTART.md](docs/DEPLOYMENT_QUICKSTART.md)** - Get up and running fast

### Complete Guides
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Comprehensive deployment guide
- **[TAG_BASED_DEPLOYMENT.md](docs/TAG_BASED_DEPLOYMENT.md)** - Tag-based release & deployment
- **[DATABASE_SETUP.md](docs/DATABASE_SETUP.md)** - PostgreSQL database setup options

## 🔧 Configuration Files

### Docker & Environment
- `docker-compose.prod.yml` - Production container orchestration
- `env.production.example` - Environment variables template

### Web Server
- `nginx/nginx.conf` - Reverse proxy, SSL termination, rate limiting

### Scripts
- `scripts/setup-ec2.sh` - One-time EC2 instance setup
- `scripts/deploy.sh` - Deployment automation with rollback support

## 🚀 Quick Deploy (Automated CI/CD)

### Prerequisites
1. **Database**: PostgreSQL (AWS RDS, DigitalOcean, etc.)
2. **Server**: Ubuntu 22.04+ with Docker & Docker Compose
3. **Docker Hub**: Account for image storage

### Setup Steps
1. **Prepare your server:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/deployment/scripts/setup-ec2.sh | bash
   ```

2. **Configure GitHub Secrets:**
   - `DOCKER_USERNAME` & `DOCKER_PASSWORD`
   - `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`

3. **Deploy with a tag:**
   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```

**That's it!** 🎉 Your CI/CD pipeline will automatically:
- Build Docker images
- Push to Docker Hub
- Deploy to your server
- Start services

## 🔧 Manual Deployment (Backup Method)

If CI/CD is unavailable, use the manual deployment script:

```bash
# On your server
cd /services/rbac
DOCKER_USERNAME=your_username TAG=v1.0.0 ./deploy.sh
```

## 🏗️ Architecture

```
Internet → Frontend:3000 (React) ↔ Backend:5001 (Go API) → External PostgreSQL
```

## 🔍 Health Checks

- **Backend**: `http://your-server:5001/health`
- **Frontend**: `http://your-server:3000`

## 💡 CI/CD Features

- ✅ **Tag-based deployment** (v1.0.0, v2.1.3, etc.)
- ✅ **Automated Docker builds**
- ✅ **Zero-downtime deployment**
- ✅ **Docker Hub integration**
- ✅ **SSH-based deployment**
- ✅ **Health checks & validation**
- ✅ **Manual deployment backup**

## 🔄 Deployment Workflow

1. **Developer** pushes a tag: `git tag v1.0.0 && git push origin v1.0.0`
2. **GitHub Actions** triggers CI/CD pipeline
3. **Docker images** built and pushed to Docker Hub
4. **Server deployment** via SSH
5. **Services** automatically started and health-checked

---

**Need help?** Check the [docs/](docs/) folder for detailed guides!
