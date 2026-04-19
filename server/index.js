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
const server = http.createServer(app);

// Dynamic CORS origin based on environment
const allowedOrigins = [
    "http://localhost:5173", 
    process.env.FRONTEND_URL,
    "https://sales.jayvarma.site",
    "https://sales-backend.jayvarma.site"
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room based on user ID for private notifications
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined room`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Middleware to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Session Configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'sales-portal-secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions'
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
    })
);

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Only listen if not running in Vercel environment
        if (require.main === module) {
            server.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
            });
        }
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️  Starting server without database (some features may be limited)');

        // Still start the server even if DB fails
        if (require.main === module) {
            server.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT} (No DB Mode)`);
            });
        }
        // Do NOT exit process
        // process.exit(1); 
    }
};

startServer();

// Export the app for Vercel
module.exports = app;
