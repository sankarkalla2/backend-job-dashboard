import express from 'express'
import db from './lib/db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticateToken } from './lib/autheticate.js';
dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.get("/jobs", authenticateToken, async (req, res) => {
    try {
        const users = await db.job.findMany({ where: { userId: req.user.userId } });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Example route to create a user
app.post('/jobs', authenticateToken, async (req, res) => {
    try {
        const { email, name } = req.body;
        console.log(email, name);
        console.log(req.user.userId);

        const job = await db.job.create({
            data: {
                email,
                name,
                userId: req.user.userId
            },
        });
        res.json(job).status(200);
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.patch('/jobs/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const { status, name } = req.body;
    try {
        const user = await db.job.update({
            where: { id: id },
            data: { status, name },
        });
        res.json(user).status(200);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error updating user' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = await req.body;
        console.log(email, password, name);

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);

        // Find user
        const user = await db.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);


        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Important: Use process.env.PORT for Vercel
const PORT = process.env.PORT || 3000;

// For Vercel, export the express app
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
