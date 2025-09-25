const Reservation = require('./../models/Reservation');
const User = require('./../models/User');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const sendEmail = require('./../utilities/email');

exports.reservationConfirmByOwner = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  if (!token) return next(new AppError('Missing token!', 400));

  const reservation = await Reservation.getReservationByOwnerToken(token);

  if (!reservation) {
    return next(new AppError('Invalid or expired link!', 400));
  }

  const isReservationConfirmed = await Reservation.confirmReservationByAccommodationOwner(reservation.id);
  const reservationOwner = await User.checkUser(reservation.guest_id);

  if(isReservationConfirmed && reservationOwner) {
    const message = `Poštovani,\nvaša rezervacija je potvrđena od strane vlasnika smeštaja koji ste rezervisali.\nHvala što koristite naše usluge.`;

    try {
      /* await sendEmail({
        email: reservationOwner.email,
        subject: `Reserve&Go Rezervacija potvrđena od strane vlasnika smeštaja`,
        message
      }); */
    } catch(err) {
      return next(new AppError('There was an error sending the email! Please try again later!', 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'Reservation confirmed successfully by accommodation owner!'
    });
  }

});