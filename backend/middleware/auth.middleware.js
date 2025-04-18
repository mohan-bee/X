const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ErrorResponse = require('../utils/errorResponse');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Get token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request object
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new ErrorResponse('User not found', 404));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Middleware to grant access based on roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
