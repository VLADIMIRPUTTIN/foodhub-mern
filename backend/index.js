import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { Server } from 'socket.io';
import http from 'http';

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import recipeRoutes from "./routes/recipe.route.js";
import ingredientRoutes from "./routes/ingredient.route.js";
import userRoutes from "./routes/user.route.js";
import favoriteRoutes from './routes/favoriteRoutes.js';
import visionRoutes from './routes/vision.route.js';
import youtubeRoutes from './routes/youtube.route.js';
import commentRoutes from './routes/comment.route.js';
import translateRoutes from './routes/translate.route.js';
import visitRoute from './routes/visit.route.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" 
            ? ["https://www.foodhubrecipes.site", "https://foodhubrecipes.site"]
            : ["http://localhost:3000", "http://localhost:5173"],
        credentials: true
    }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // When user joins, store their socket id with their user id
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);
    });
    
    socket.on('disconnect', () => {
        // Remove user from connected users when they disconnect
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// Make io available to other modules
app.set('io', io);
app.set('connectedUsers', connectedUsers);

const __dirname = path.resolve();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://foodhub-mern-production.up.railway.app",
    "https://www.foodhubrecipes.site",
    "https://foodhubrecipes.site",
];

// Simplified CORS configuration for production
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Log unauthorized origins
        console.log("⚠️ Request from unauthorized origin:", origin);
        
        // ✅ For production: Allow all origins temporarily for debugging
        return callback(null, true);
        
        // ❌ After fixing, use strict CORS:
        // return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// ✅ Increase body size limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/visit", visitRoute);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
