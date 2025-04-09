import { getAuth } from 'firebase-admin/auth';

// Middleware to verify Firebase Auth token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - Token is empty" });
    }
    
    // Verify the token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Attach the user info to the request
    req.user = decodedToken;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized - Token expired' });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({ error: "Unauthorized - Invalid token format" });
    } 
    
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

export default authMiddleware;