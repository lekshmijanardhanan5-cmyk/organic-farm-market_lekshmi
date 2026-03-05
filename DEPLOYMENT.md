# Deployment Guide - Organic Farm Market

This guide will walk you through deploying your MERN stack application to:
- **Vercel** (Frontend - React/Vite)
- **Render** (Backend - Node.js/Express)
- **MongoDB Atlas** (Cloud Database)

---

## Prerequisites

- GitHub account with your project repository
- All code pushed to GitHub
- Basic understanding of environment variables

---

## Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign Up"**
3. Create your account (you can use Google/GitHub to sign up)

### 1.2 Create a Cluster
1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (Free forever)
3. Select a cloud provider and region (choose closest to your users)
4. Click **"Create"** (cluster creation takes 1-3 minutes)

### 1.3 Configure Database Access
1. In the left sidebar, go to **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username and generate a secure password (save this!)
5. Set user privileges to **"Atlas admin"** (or "Read and write to any database")
6. Click **"Add User"**

### 1.4 Configure Network Access
1. In the left sidebar, go to **"Network Access"**
2. Click **"Add IP Address"**
3. For production, click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - **Note**: For better security, you can add Render's IP ranges later
4. Click **"Confirm"**

### 1.5 Get Connection String
1. In the left sidebar, go to **"Database"**
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
6. Replace `<username>` and `<password>` with your database user credentials
7. Add your database name at the end (before `?`): `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/your-database-name?retryWrites=true&w=majority`
8. **Save this connection string** - you'll need it for Render!

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account (recommended for easy deployment)

### 2.2 Create New Web Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select your repository
4. Render will auto-detect it's a Node.js project

### 2.3 Configure Backend Service
Fill in the following settings:

**Basic Settings:**
- **Name**: `organic-farm-market-api` (or any name you prefer)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` (important!)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Click **"Add Environment Variable"** and add these one by one:

```
PORT = 10000
```
(Render automatically assigns a port, but 10000 is a safe default)

```
MONGO_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/your-database-name?retryWrites=true&w=majority
```
(Paste your MongoDB Atlas connection string here)

```
JWT_SECRET = your-super-secret-jwt-key-change-this-to-something-random
```
(Generate a random string - you can use: `openssl rand -base64 32` or any random string generator)

```
FRONTEND_URL = https://your-vercel-app.vercel.app
```
(We'll update this after deploying frontend - for now, use a placeholder or leave as `http://localhost:5173`)

### 2.4 Deploy
1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying your backend
3. Wait for deployment to complete (usually 2-5 minutes)
4. Once deployed, you'll see a URL like: `https://organic-farm-market-api.onrender.com`
5. **Copy this URL** - you'll need it for the frontend!

### 2.5 Update FRONTEND_URL (After Frontend is Deployed)
1. Go back to your Render service dashboard
2. Click **"Environment"** tab
3. Find `FRONTEND_URL` and update it to your Vercel URL
4. Click **"Save Changes"** - Render will automatically redeploy

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with your GitHub account (recommended)

### 3.2 Import Project
1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### 3.3 Configure Frontend Project
**Framework Preset:**
- Should auto-detect as **"Vite"** - if not, select it manually

**Root Directory:**
- Click **"Edit"** next to Root Directory
- Set it to: `client`

**Build and Output Settings:**
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

**Environment Variables:**
Click **"Add"** and add:

```
VITE_API_URL = https://your-render-backend-url.onrender.com
```
(Use the Render backend URL you copied in Step 2.4)

**Important**: Make sure there's **NO trailing slash** at the end of the URL!

### 3.4 Deploy
1. Click **"Deploy"**
2. Vercel will build and deploy your frontend (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-project-name.vercel.app`
4. **Copy this URL** - you'll need it to update Render's FRONTEND_URL!

### 3.5 Update Backend CORS (Final Step)
1. Go back to Render dashboard
2. Navigate to your backend service
3. Click **"Environment"** tab
4. Update `FRONTEND_URL` to your Vercel URL (e.g., `https://your-project-name.vercel.app`)
5. Click **"Save Changes"**
6. Render will automatically redeploy with the updated CORS settings

---

## Step 4: Verify Deployment

### 4.1 Test Backend
1. Open your Render backend URL in browser: `https://your-backend.onrender.com`
2. You should see: `{"message":"API is running"}`
3. If you see this, your backend is working!

### 4.2 Test Frontend
1. Open your Vercel frontend URL in browser
2. Try to register/login
3. If it works, your deployment is successful!

### 4.3 Common Issues

**CORS Errors:**
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly (including `https://`)
- No trailing slashes in URLs
- Wait for Render to finish redeploying after updating environment variables

**Database Connection Errors:**
- Verify MongoDB Atlas network access allows `0.0.0.0/0` (or Render's IPs)
- Check that your connection string has the correct username, password, and database name
- Make sure there are no extra spaces in the connection string

**Frontend Can't Connect to Backend:**
- Verify `VITE_API_URL` in Vercel matches your Render backend URL exactly
- Make sure there's no trailing slash
- Check browser console for errors

**Build Failures:**
- Check build logs in Vercel/Render dashboard
- Make sure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## Step 5: Optional - Custom Domain (Later)

### Vercel Custom Domain
1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

### Render Custom Domain
1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your custom domain
4. Update DNS records as instructed

**Remember**: If you change domains, update `FRONTEND_URL` in Render and `VITE_API_URL` in Vercel!

---

## Environment Variables Summary

### Backend (Render) - Required:
```
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (Vercel) - Required:
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Important Notes

1. **Free Tier Limitations:**
   - **Render**: Free tier services spin down after 15 minutes of inactivity. First request after spin-down takes ~30-50 seconds to wake up.
   - **Vercel**: Free tier is generous but has usage limits
   - **MongoDB Atlas**: Free tier (M0) has 512MB storage limit

2. **Keep Render Service Awake:**
   - You can use services like [UptimeRobot](https://uptimerobot.com) (free) to ping your Render service every 5 minutes to keep it awake

3. **Security:**
   - Never commit `.env` files to GitHub
   - Use strong, random values for `JWT_SECRET`
   - Keep your MongoDB password secure

4. **Updates:**
   - When you push to GitHub, Vercel and Render will automatically redeploy
   - Make sure to update environment variables in both platforms if needed

---

## Troubleshooting

### Render Service Won't Start
- Check build logs for errors
- Verify all dependencies are in `package.json`
- Make sure `start` script exists in `package.json`

### Vercel Build Fails
- Check that `client` directory is set as root
- Verify `vite.config.js` exists
- Check build logs for specific errors

### Database Connection Issues
- Test MongoDB connection string locally first
- Verify network access in MongoDB Atlas
- Check that database user has correct permissions

### CORS Still Not Working
- Clear browser cache
- Check browser console for exact CORS error
- Verify `FRONTEND_URL` in Render matches Vercel URL exactly (case-sensitive, include https://)
- Wait for Render redeployment to complete

---

## Support Resources

- **Render Docs**: [https://render.com/docs](https://render.com/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] MongoDB connection string saved
- [ ] Render backend deployed with all environment variables
- [ ] Backend URL copied
- [ ] Vercel frontend deployed with `VITE_API_URL`
- [ ] Frontend URL copied
- [ ] `FRONTEND_URL` updated in Render
- [ ] Tested registration/login on deployed site
- [ ] Everything works! 🎉

---

Good luck with your deployment! If you encounter any issues, check the troubleshooting section or the platform-specific documentation.
