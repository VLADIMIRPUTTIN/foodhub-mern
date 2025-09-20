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
import favoriteRoutes from "./routes/favoriteRoutes.js";
import visionRoutes from "./routes/vision.route.js";
import youtubeRoutes from "./routes/youtube.route.js"; // Add this import

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" 
            ? ["https://foodhubrecipe.shop", "https://www.foodhubrecipe.shop"] 
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
    "https://foodhub-mern-production.up.railway.app",
    "https://foodhubrecipe.shop",
    "https://www.foodhubrecipe.shop"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser()); // allows us to parse incoming cookies

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/youtube", youtubeRoutes); // Add this route

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
