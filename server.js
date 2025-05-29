require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./src/database/connection');

// Environment-configured paths and port
const PORT = process.env.PORT || 3000;
const KEY_PATH = process.env.TLS_KEY_PATH;
const CERT_PATH = process.env.TLS_CERT_PATH;

// Create Express app
const app = express();

// Connect to databases
connectDB();

// Security middleware
app.use(cors());
app.use(bodyParser.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://livekit.cloud"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "https://stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again after an hour'
});
app.use('/api/auth', authLimiter);

// Serve static frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// API route imports
app.use('/api/admin',        require('./server/routes/admin'));
app.use('/api/auth',         require('./server/routes/auth'));
app.use('/api/users',        require('./server/routes/users'));
app.use('/api/checkout',     require('./server/routes/checkout'));
app.use('/api/usage',        require('./server/routes/usage'));
app.use('/api/webhook',      require('./server/routes/webhooks'));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server with HTTPS if certificates provided, otherwise HTTP
function startServer() {
  if (KEY_PATH && CERT_PATH) {
    const options = {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH),
    };
    https.createServer(options, app).listen(PORT, () => {
      console.log(`LARK Server running securely on https://localhost:${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`LARK Server running on http://localhost:${PORT}`);
    });
  }
}

// Ensure DB connection before starting
connectDB()
  .then(startServer)
  .catch(err => {
    console.error('DB connection failed, starting server anyway:', err);
    startServer();
  });
