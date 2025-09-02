# 🚀 RBAC Deployment

This folder contains all the deployment-related files and documentation for the RBAC application.

## 📁 Folder Structure

```
deployment/
├── README.md                      # This file
├── docker-compose.prod.yml        # Production Docker Compose configuration
├── env.production.example         # Environment variables template
├── scripts/
│   ├── deploy.sh                  # Main deployment script
│   └── setup-ec2.sh              # EC2 instance setup script
├── nginx/
│   └── nginx.conf                 # Nginx reverse proxy configuration
└── docs/
    ├── DEPLOYMENT.md              # Complete deployment guide
    ├── DEPLOYMENT_QUICKSTART.md   # Quick start guide (10 minutes)
    └── DATABASE_SETUP.md          # PostgreSQL database setup guide
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

## 🚀 Quick Deploy

1. **Set up database** (PostgreSQL - AWS RDS, DigitalOcean, etc.)
2. **Launch EC2 instance** (Ubuntu 22.04, t3.small+)
3. **Run setup script:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/deployment/scripts/setup-ec2.sh | bash
   ```
4. **Configure GitHub secrets** (database credentials, EC2 details)
5. **Create a release tag** → automatic deployment!
   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```

## 🏗️ Architecture

```
Internet → Nginx (80/443) → Frontend (React) + Backend (Go API) → External PostgreSQL
```

## 🔍 Health Checks

- **Backend**: `http://your-server:5001/health-check`
- **Frontend**: `http://your-server:80`

## 💡 Features

- ✅ **Zero-downtime deployment**
- ✅ **Automatic rollback on failure**
- ✅ **SSL/HTTPS ready**
- ✅ **Database backup integration**
- ✅ **Monitoring & health checks**
- ✅ **Security hardening**

---

**Need help?** Start with [DEPLOYMENT_QUICKSTART.md](docs/DEPLOYMENT_QUICKSTART.md) for a 10-minute setup guide.
