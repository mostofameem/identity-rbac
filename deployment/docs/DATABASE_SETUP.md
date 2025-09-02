# PostgreSQL Database Setup Guide

This guide helps you set up an external PostgreSQL database for your RBAC application.

## 🗄️ Database Provider Options

### 1. AWS RDS (Recommended for Production)

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "PostgreSQL"
4. Select "Free tier" (if eligible)
5. Set DB instance identifier: `rbac-postgres`
6. Master username: `rbac_user`
7. Set a strong password
8. Initial database name: `rbac_db`
9. Enable automated backups
10. Create database

**Security Group Configuration:**
- Allow PostgreSQL access (port 5432) from your EC2 security group

### 2. DigitalOcean Managed Database

1. Go to DigitalOcean Control Panel
2. Click "Create" → "Databases"
3. Choose PostgreSQL
4. Select region (same as your EC2)
5. Choose plan (Basic $15/month minimum)
6. Set database name: `rbac_db`
7. Create cluster
8. Add your EC2 IP to trusted sources

### 3. Free Options

#### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Set database password
4. Note down connection details

#### Neon
1. Go to [neon.tech](https://neon.tech)
2. Create account and project
3. Note connection string

## 🔧 Environment Variables

```bash
# For AWS RDS
DB_HOST=rbac-postgres.abc123.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=rbac_user
DB_PASSWORD=YourSecurePassword123!
DB_NAME=rbac_db
DB_SSL_MODE=require

# For Supabase
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_SSL_MODE=require
```

## 🔍 Test Connection

```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

## 💰 Cost Comparison

- **AWS RDS Free Tier**: 12 months free (750 hours/month)
- **Supabase**: 500MB free
- **Neon**: 3GB free with branches
- **DigitalOcean**: $15/month managed

Choose based on your budget and requirements!
