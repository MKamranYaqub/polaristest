# Supabase Project Setup

This is a full-stack application that demonstrates integration with Supabase for authentication and data management.

## Project Structure

```
/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── services/     # API services
│   └── .env            # Frontend environment variables
└── backend/           # Express backend
    ├── config/        # Configuration
    ├── controllers/   # Route controllers
    ├── routes/        # API routes
    └── .env          # Backend environment variables
```

## Getting Started

1. Create a Supabase Project:
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up/Login and create a new project
   - Get your project URL and anon/service-role keys

2. Configure Environment Variables:
   - Frontend (.env):
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   - Backend (.env):
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3001
   ```

3. Install Dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

4. Start the Development Servers:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

## Features

- User Authentication (Supabase Auth)
- Data CRUD Operations
- Real-time Updates
- Secure API Endpoints

## Environment Setup

1. Frontend Environment (.env):
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Backend Environment (.env):
   ```
   PORT=3001
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Security Notes

- Keep your service role key secure and never expose it in the frontend
- Use row level security (RLS) in Supabase for data access control
- Implement proper authentication checks in API routes