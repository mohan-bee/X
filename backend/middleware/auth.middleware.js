const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const Organisation = require('../models/org.model')
const ErrorResponse = require('../utils/errorResponse')

exports.protect = async (req, res, next) => {
  let token

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  } else if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    let user = await User.findById(decoded.id).select('-password')
    if (!user) {
      user = await Organisation.findById(decoded.id).select('-password')
      if (!user) {
        return next(new ErrorResponse('User or organisation not found', 404))
      }
      user.isOrganisation = true
    }

    req.user = user
    next()
  } catch (error) {
    console.error("JWT verification error:", error)
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
}

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.isOrganisation) {
      if (!roles.includes('organisation')) {
        return next(
          new ErrorResponse(
            'Organisation account is not authorized to access this route',
            403
          )
        )
      }
      if (roles.includes('approved') && !req.user.approved) {
        return next(
          new ErrorResponse(
            'Organisation is pending approval and cannot access this route',
            403
          )
        )
      }
    } else if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      )
    }
    next()
  }
}

exports.ownsOrganisation = async (req, res, next) => {
  try {
    const organisation = await Organisation.findById(req.params.id)

    if (!organisation) {
      return next(new ErrorResponse('Organisation not found', 404))
    }

    if (!req.user.isOrganisation && req.user.role === 'admin') {
      return next()
    }

    if (req.user.isOrganisation && req.user._id.toString() === req.params.id) {
      return next()
    }

    return next(
      new ErrorResponse('Not authorized to access this organisation', 403)
    )
  } catch (error) {
    console.error("Error in ownsOrganisation middleware:", error)
    return next(new ErrorResponse('Authentication error', 500))
  }
}

exports.adminOnly = (req, res, next) => {
  if (req.user.isOrganisation || req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Admin access required', 403)
    )
  }
  next()
}

exports.allowFeedback = async (req, res, next) => {
  if (req.user.isOrganisation || req.user.role === 'User') {
    return next()
  }

  return next(
    new ErrorResponse(
      `User role '${req.user.role}' is not authorized to submit feedback`,
      403
    )
  )
}
