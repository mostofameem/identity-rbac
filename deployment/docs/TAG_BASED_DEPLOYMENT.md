# 🏷️ Tag-Based Release & Deployment Guide

This guide explains how to deploy your RBAC application using tags and manual branch selection for better release control.

## 🎯 Deployment Methods

Your CI/CD pipeline supports two deployment methods:

### 1. **Tag-Based Automatic Deployment** (Recommended for Production)
- Create a tag → Automatic deployment
- Perfect for production releases
- Follows semantic versioning

### 2. **Manual Branch Deployment** 
- Choose any branch to deploy
- Select target environment
- Great for testing and staging

---

## 🏷️ Method 1: Tag-Based Deployment

### **Step 1: Create a Release Tag**

#### Using Git Command Line:
```bash
# Make sure you're on the branch you want to release
git checkout main  # or develop, deployment-dev, etc.

# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Or create a release tag
git tag release-production
git push origin release-production
```

#### Using GitHub Web Interface:
1. Go to your repository: [https://github.com/mostofameem/identity-rbac](https://github.com/mostofameem/identity-rbac)
2. Click **"Releases"** → **"Create a new release"**
3. Click **"Choose a tag"** → Type your tag (e.g., `v1.0.0`)
4. Select the **branch/commit** to tag
5. Add release title and description
6. Click **"Publish release"**

### **Supported Tag Formats:**
- `v1.0.0`, `v2.1.3` (semantic versioning)
- `release-production`, `release-staging`
- `release-1.0`, `release-hotfix`

### **What Happens:**
✅ Automatic deployment to production  
✅ Docker images tagged with version  
✅ Deployment logs created  
✅ Health checks performed  

---

## 🎮 Method 2: Manual Branch Deployment

### **Step 1: Trigger Manual Deployment**
1. Go to your repository → **Actions** tab
2. Click **"Deploy to AWS EC2"** workflow
3. Click **"Run workflow"** button
4. Fill in the form:
   - **Branch**: Choose which branch to deploy
   - **Environment**: production/staging/development  
   - **Version**: Optional version tag

### **Available Options:**

#### **Branch Selection:**
- `main` - Main production branch
- `develop` - Development branch
- `deployment-dev` - Deployment testing branch
- `staging` - Staging branch

#### **Environment Selection:**
- `production` - Live production server
- `staging` - Staging environment
- `development` - Development environment

#### **Version Tag (Optional):**
- Custom version identifier
- If empty, uses `manual-deploy`

---

## 📋 Deployment Workflow Examples

### **Example 1: Production Release**
```bash
# 1. Merge features to main
git checkout main
git merge feature-branch

# 2. Create release tag
git tag v1.2.0
git push origin v1.2.0

# 3. Automatic deployment starts!
```

### **Example 2: Staging Deployment**
1. Go to GitHub Actions
2. Run workflow manually:
   - Branch: `develop`
   - Environment: `staging`
   - Version: `v1.2.0-staging`

### **Example 3: Hotfix Release**
```bash
# 1. Create hotfix branch
git checkout -b hotfix-1.1.1

# 2. Make fixes and commit
git commit -m "Fix critical bug"

# 3. Create hotfix tag
git tag v1.1.1
git push origin v1.1.1

# 4. Automatic deployment!
```

---

## 🔍 Monitoring Deployments

### **GitHub Actions:**
1. Go to **Actions** tab in your repository
2. Click on the deployment run
3. Monitor real-time logs
4. Check deployment status

### **Deployment Logs on Server:**
```bash
# SSH to your EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# View deployment history
cat /home/ubuntu/rbac-app/deployment.log

# Check running containers
docker ps

# View container logs
docker logs rbac-backend
docker logs rbac-frontend
```

---

## 🏗️ Deployment Information

Each deployment includes:
- ✅ **Trigger type** (tag/manual)
- ✅ **Version identifier**
- ✅ **Source branch**
- ✅ **Target environment**
- ✅ **Deployment timestamp**
- ✅ **Docker image tags**

### **Example Deployment Log:**
```
🚀 Deployment Information:
Trigger: tag
Version: v1.2.0
Branch: main
Environment: production
Timestamp: 2024-01-15 10:30:45

🎉 Deployment completed successfully!
```

---

## 🔄 Rollback Strategy

### **Quick Rollback:**
```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run rollback
cd /home/ubuntu/rbac-app
./deployment/scripts/deploy.sh rollback
```

### **Deploy Previous Version:**
1. Find previous working tag in GitHub releases
2. Use manual deployment with that tag
3. Or create new tag pointing to previous commit

---

## 📝 Best Practices

### **Version Tagging:**
- ✅ Use semantic versioning: `v1.2.3`
- ✅ Tag stable commits only
- ✅ Include release notes
- ✅ Test before tagging

### **Branch Strategy:**
- ✅ `main` - Production ready code
- ✅ `develop` - Integration branch
- ✅ `feature/*` - Feature branches
- ✅ `hotfix/*` - Emergency fixes

### **Environment Management:**
- ✅ `production` - Live environment
- ✅ `staging` - Pre-production testing
- ✅ `development` - Development testing

### **Release Process:**
1. **Develop** → Test features
2. **Staging** → Integration testing  
3. **Tag** → Create release
4. **Production** → Automatic deployment
5. **Monitor** → Check health & logs

---

## 🚨 Troubleshooting

### **Tag Deployment Not Triggering:**
- Check tag format matches pattern (`v*.*.*` or `release-*`)
- Verify GitHub Actions workflow file is in main branch
- Check repository permissions

### **Manual Deployment Failing:**
- Verify branch exists
- Check GitHub secrets are configured
- Ensure EC2 instance is accessible

### **Health Check Failures:**
```bash
# Check backend status
curl http://your-ec2-ip:5001/health-check

# Check container logs
docker logs rbac-backend

# Restart if needed
docker-compose -f deployment/docker-compose.prod.yml restart
```

---

## 📖 Quick Reference

### **Create Release Tag:**
```bash
git tag v1.0.0 && git push origin v1.0.0
```

### **Manual Deployment:**
GitHub → Actions → Deploy to AWS EC2 → Run workflow

### **Check Deployment:**
```bash
curl http://your-ec2-ip:5001/health-check
```

### **View Logs:**
```bash
ssh ubuntu@your-ec2-ip
cat /home/ubuntu/rbac-app/deployment.log
```

---

This tag-based deployment system gives you full control over when and what gets deployed, making it perfect for production environments! 🚀
