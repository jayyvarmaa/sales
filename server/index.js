const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search'); // Add this

const app = express();

// Dynamic CORS origin based on environment
const allowedOrigins = [
    "http://localhost:5173", 
    process.env.FRONTEND_URL,
    "https://sales.jayvarma.site",
    "https://sales-backend.jayvarma.site"
].filter(Boolean);

// Socket.io initialization (Disabled for Vercel Serverless, enabled for local dev)
let io;
if (require.main === module) {
    const server = http.createServer(app);
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    // Socket.io connection handler
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on('join', (userId) => {
            if (userId) socket.join(userId);
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    // Middleware to attach io to req (limited functionality on Vercel)
    app.use((req, res, next) => {
        req.io = io;
        next();
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Local Server running on port ${PORT}`);
    });
} else {
    // Vercel environment: Attach a mock io to prevent crashes in routes
    app.use((req, res, next) => {
        req.io = { emit: () => {} };
        next();
    });
}

// Trust proxy is required for secure cookies on Vercel/proxies
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Session Configuration
const sessionConfig = {
    name: 'sales_portal_session',
    secret: process.env.SESSION_SECRET || 'sales-portal-secret',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true, 
        sameSite: 'none', 
        domain: '.jayvarma.site',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

// Use mongoUrl for Session Store to avoid connection timing issues on Vercel
if (process.env.MONGO_URI) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    });
}

app.use(session(sessionConfig));

// Auth Profile endpoint for session check
app.get('/api/auth/profile', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            isAuthenticated: true,
            userId: req.session.userId
        });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes); // Add this

// Health check & Root route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Sales Portal API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// Database connection logic
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
    }
};

// Initial connection attempt
connectDB();

// Export the app for Vercel
module.exports = app;
