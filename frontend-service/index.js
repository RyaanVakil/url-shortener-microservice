// In frontend-service/index.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 8080;

const BACKEND_API_URL = process.env.BACKEND_API_URL;

// 1. Proxy all API requests that start with /api
if (BACKEND_API_URL) {
  app.use('/api', createProxyMiddleware({
    target: BACKEND_API_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // remove /api prefix when forwarding
    },
  }));
  console.log("Proxying API requests to:", BACKEND_API_URL);
}

// 2. Serve static assets from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 3. This final middleware will catch all other requests and serve the main HTML file.
// This avoids the app.get('*') router issue entirely.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend service running at http://localhost:${PORT}`);
});