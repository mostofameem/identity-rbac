# Identity-RBAC

## Project Description

RBAC is a web-based application designed to help efficiently manage and monitor events. It enables spesific user to create, update, manage events. 

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Credits](#credits)
- [Contributing](#contributing)

## Installation

## 1. **Clone the repository**
   ```bash
   git clone https://github.com:mostofameem/identity-rbac.git
   cd identity-rbac
   ```

## 2.  🚀 Project Initialization Guide

Follow the steps below to set up and run the project smoothly:

---

### ✅ Step 1: Environment Variables

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```


### ✅ Step 2: Database Migration
Initialize the required database tables:   

    make migrate

Alternative
```bash
go run main.go serve-migrate
```

This command will create all schema migrations.

### ✅ Step 3: Data Seeding
Populate the database with essential seed data: 

    make seeding

Alternative
```bash
go run main.go serve-seeding
```

This includes default modules for initial use.

### ✅ Step 4: Super Admin Setup
Create the configuration file for the super admin user:
```bash
cp user_config.example.json user_config.json
```

Then, open user_config.json and provide the super admin's credentials:

    {
        "userEmail": "",
        "userPassword": ""
    }

Now, run the user creation command:

    make add-user

Alternative
```bash
go run main.go serve-add-user
```

This will create the super admin user with full system access.


## 3. Run the Project
   Using Docker
   ```bash
   docker-compose build
   docker-compose up -d
   ```

   Run With Air
   
   ```bash
   make dev
   ```
   Run Using main
   ```bash
   go run main.go serve-rest
   ```

## 4. Usage

- Access the web app swagegr at `http://localhost:5001/swagger`.
- Features include:
  - Create Role
  - Asign role to user
  - Create Permission
  - Add permission to role

## 5. Credits

- **Backend**: Go
- **Database**: PostgreSQL

Developed by Mostofa Meem

## Deployment

For production deployment to AWS EC2 with CI/CD, see the **[deployment](deployment/)** folder:

- 🚀 **[Quick Start Guide](deployment/docs/DEPLOYMENT_QUICKSTART.md)** - 10-minute setup
- 📖 **[Complete Deployment Guide](deployment/docs/DEPLOYMENT.md)** - Comprehensive instructions
- 🗄️ **[Database Setup Guide](deployment/docs/DATABASE_SETUP.md)** - PostgreSQL configuration

### Quick Deploy Summary:
1. Set up PostgreSQL database (AWS RDS, DigitalOcean, etc.)
2. Launch EC2 instance and run setup script
3. Configure GitHub secrets
4. Push to main branch → automatic deployment!

## 6. Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-xyz`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature-xyz`)
5. Open a Pull Request
