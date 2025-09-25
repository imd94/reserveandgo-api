const Accommodation = require('./../models/Accommodation');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');

exports.getAccommodationByOwner = catchAsync(async (req, res, next) => {
  const ownerId = req.params.owner;
  const accommodation = await Accommodation.getAccommodationByOwner(ownerId);

  if(!accommodation) {
    return next(new AppError('No accommodation was found by that owner.', 401));
  }

  res.status(200).json({
    status: 'success',
    accommodation: accommodation
  });
});