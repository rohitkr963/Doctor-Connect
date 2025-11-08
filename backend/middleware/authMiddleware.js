const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
  let token;
  const User = require('../models/User');

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token ko header se nikalna
      token = req.headers.authorization.split(' ')[1];

      // Token ko verify karna
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Database mein doctor ko dhoondhna
      const doctor = await Doctor.findById(decoded.id).select('-password');
      if (doctor) {
        req.doctor = doctor;
        return next();
      }
      // Doctor nahi mila, ab user dhoondo
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
      // Dono nahi mile
      res.status(401).json({ message: 'Not authorized, token is not valid for doctor or user' });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Optional auth middleware - sets req.user if token exists, but doesn't block request if no token
const optionalAuth = async (req, res, next) => {
  let token;
  const User = require('../models/User');

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find doctor first
      const doctor = await Doctor.findById(decoded.id).select('-password');
      if (doctor) {
        req.doctor = doctor;
        return next();
      }
      
      // Then try user
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
      
      // Token invalid but continue anyway
      next();
    } catch (error) {
      console.error('Optional auth error:', error.message);
      // Don't fail, just continue without setting req.user
      next();
    }
  } else {
    // No token provided, continue without auth
    next();
  }
};

module.exports = { protect, optionalAuth };
