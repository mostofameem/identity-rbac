# Event Management Frontend

This is the React frontend for the Event Management System.

## Features

- User authentication with JWT tokens
- View ongoing events
- Register for events
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory with:

```
REACT_APP_API_URL=http://localhost:5001
```

## Backend Requirements

Make sure your backend API is running on the configured URL (default: http://localhost:5001).

The frontend expects the following API endpoints:
- `POST /v1/login` - User authentication
- `GET /v1/events?mode=ONGOING` - Get ongoing events
- `POST /v1/events/{id}/register` - Register for an event
- `GET /v1/token/refresh` - Refresh JWT token 