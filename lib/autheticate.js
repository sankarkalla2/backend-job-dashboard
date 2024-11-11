// Middleware to protect routes
import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {   
        return res.status(401).json({ error: 'Access denied' });
    }
    console.log(token);

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log(verified);
        req.user = verified;

        console.log(req.user);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};