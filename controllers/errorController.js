const AppError = require('./../utilities/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}

const sendErrorProd = (err, res) => {
  // Operational trusted errors: send message to the client
  if(err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  // Programming or other unknown errors: don't leak info to the client
  } else {
    // 1. Log error
    console.error('ERROR', err);

    // 2. Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    if(process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res);
    } else if(process.env.NODE_ENV === 'production') {
      //let error = { ...err };
      let error = { ...err, message: err.message, name: err.name };

      if(err.name === 'CastError') error = handleCastErrorDB(error);  

      sendErrorProd(error, res);
    }
}