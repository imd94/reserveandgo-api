const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const Settings = require('./../models/Settings');

exports.getSettings = catchAsync(async (req, res, next) => {
  const settings = await Settings.getSettings();

  if(!settings.length) {
    return next(new AppError(`No Settings found.`, 404));
  }

  res.status(200).json({
    status: 'success',
    results: settings.length,
    data: {
      settings
    }
  });
});