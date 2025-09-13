const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../models/User');
const catchAsync = require('./../utilities/catchAsync');
const crypto = require('crypto');
const AppError = require('./../utilities/appError');

const signToken = (id) => {
  return jwt.sign(
    { id: id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // 90 days in miliseconds
    ),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    user
  });
}

exports.login = catchAsync(async (req, res, next) => {
  const user = new User(req.body);
  const attemtedUser = await user.login();

  if(attemtedUser) {
    sendToken(attemtedUser, 200, res);
  } else {
    next(new AppError(user.errors, 400));
  }
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // exist for 10s
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
}

exports.authCheck = catchAsync(async (req, res, next) => {
  let token;

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if(req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if(!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.checkUser(decoded.id);

  if(!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  req.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (!req.cookies.jwt) return res.status(200).json({ authenticated: false });

  const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
  const currentUser = await User.checkUser(decoded.id);

  if(!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  res.status(200).json({
    status: 'success',
    user: currentUser
  });
});


exports.isAuth = function(req, res) {
  if(req.user) {
    res.json(req.user)
  } else {
    res.json(false);
  }
}
