# Local Development Setup Guide

## Issue: Signin Error on Local Development

If you're getting signin errors when running locally, it's because the frontend `.env` file is missing.

## Solution

### Step 1: Create Frontend Environment File

Navigate to the `fronted` folder and create a `.env` file:

```bash
cd fronted
```

Create a file named `.env` with the following content:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Step 2: Start Backend Server

```bash
cd backend
npm start
```

The backend should start on port 5000.

### Step 3: Start Frontend Server

```bash
cd fronted
npm start
```

The frontend should start on port 3000.

## Environment Variables Explanation

### Frontend (.env in fronted folder)
- `REACT_APP_API_BASE_URL` - Points to your backend API
  - **Local Development**: `http://localhost:5000`
  - **Production (Vercel)**: `https://your-backend-url.railway.app`

### Backend (.env in backend folder)
Already exists with:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default 5000)
- Other service API keys

## Deployment vs Local

### Local Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Frontend connects to local backend

### Production (Deployed)
- Frontend: Vercel (https://doctor-connect-fronted.vercel.app)
- Backend: Railway or similar
- Frontend connects to deployed backend URL

## Common Issues

### Issue 1: API calls returning undefined
**Cause**: `.env` file missing in frontend
**Solution**: Create `.env` file with `REACT_APP_API_BASE_URL`

### Issue 2: CORS errors
**Cause**: Backend not allowing local origin
**Solution**: Check `backend/index.js` line 23-26, ensure `http://localhost:3000` is in allowed origins

### Issue 3: Backend not connecting to MongoDB
**Cause**: Invalid MongoDB connection string
**Solution**: Check `backend/.env` file has correct `MONGO_URI`

## Quick Setup Commands

```bash
# Frontend
cd fronted
echo REACT_APP_API_BASE_URL=http://localhost:5000 > .env
npm install
npm start

# Backend (in another terminal)
cd backend
npm install
npm start
```

## Verification

1. Backend should log: "Server running on port 5000"
2. Backend should log: "MongoDB Connected"
3. Frontend should open at http://localhost:3000
4. Try signing in - should work without errors
