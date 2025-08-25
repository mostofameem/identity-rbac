## Create migration with sequenc
    migrate create -ext sql -dir internal/migrations -seq create_table_

## 🚀 Project Initialization Guide

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

### ▶️ Step 5: Run the Project
Start the development server using:

    make dev

Alternative
```bash
go run main.go serve-rest
```

