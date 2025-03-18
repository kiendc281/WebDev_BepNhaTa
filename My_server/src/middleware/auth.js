const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
    // Get the auth header
    const authHeader = req.headers['authorization'];
    // Extract the token from the Authorization header (Bearer TOKEN)
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = {
    authenticateToken
}; 