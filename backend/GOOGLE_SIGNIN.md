Setup for Google Sign-In

1. Install dependency in backend:

   npm install google-auth-library

2. Environment variables (backend):
   - `GOOGLE_CLIENT_ID` = your Google OAuth Client ID (from Google Cloud Console)
   - `JWT_SECRET` = your existing JWT secret

3. Environment variables (frontend):

   Create `.env` in the frontend folder with:

   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

4. Start services:

   In backend:
   npm install
   npm run dev

   In frontend:
   npm install
   npm start

Notes:

- The frontend uses Google Identity Services (GSI) to obtain an ID token, then POSTs it to `/api/auth/google`.
- The backend verifies the token and creates/returns a JWT the same way as existing login/signup.
- Make sure the OAuth client ID is configured for Web application and allowed origins include your frontend URL (e.g., http://localhost:3000).
