# Local Development Setup

## Fix CORS Issue - Environment Configuration

Your `.env` file currently points to the production Railway backend. For local development, you need to update it.

### Steps:

1. Open `c:\Users\nk756\Desktop\Doctor-Connect\fronted\.env`

2. Update the content to:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Start Backend and Frontend:

**Terminal 1 - Backend:**
```bash
cd c:\Users\nk756\Desktop\Doctor-Connect\backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\nk756\Desktop\Doctor-Connect\fronted
npm start
```

### For Production:
When deploying, change back to:
```env
REACT_APP_API_BASE_URL=https://doctor-connect.up.railway.app
REACT_APP_SOCKET_URL=https://doctor-connect.up.railway.app
```

---

✅ Backend CORS configuration has already been fixed to support localhost:3000
