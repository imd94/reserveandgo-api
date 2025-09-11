require('dotenv').config();
const express = require("express");
const morgan = require('morgan');
const AppError = require('./utilities/appError'); 
const globalErrorHandler = require('./controllers/errorController');
const routerApi = require('./router-api');
const apiPath = process.env.CUSTOM_PATH;
const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.urlencoded({ extended: false })); // add user submited data (from form) to our request object
app.use(express.json()); // send json data to our request object

// 3) ROUTES
app.use(apiPath, routerApi);

// HANDLE UNMATCHED ROUTES (404)
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
