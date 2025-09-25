const Reservation = require('./../models/Reservation');
const User = require('./../models/User');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const crypto = require('crypto');
const sendEmail = require('./../utilities/email');

const generateCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

exports.createGuestReservation = catchAsync(async (req, res, next) => {
  let userId, needVerification = false, code, expires;
  const newGuest = new User(req.body);

  // Check if user exists
  const existingUser = await User.findUserByEmail(newGuest.data.email);

  if(existingUser) {
    // Check if existing user is verified
    const isExistingUserVerified = await User.checkIfUserIsVerified(existingUser.id);

    // Check if existing user has pending reservations
    const { pending_count } = await Reservation.checkPendingReservations(existingUser.id);

    if(pending_count) {
      return next(new AppError('Sorry, you can not make new reservation until previous reservations are confirmed!', 500));
    }

    userId = existingUser.id;

    // If existing user is not verified send confirmation code
    if(!isExistingUserVerified) {
      needVerification = true;
      code = generateCode();
      expires = new Date(Date.now() + 10 * 60 * 1000); // 10min
    }
  } else {
    const { newGuestUser, id } = await newGuest.createGuestUser();

    userId = id;
    needVerification = true;
    code = generateCode();
    expires = new Date(Date.now() + 10 * 60 * 1000); // 10min
  }

  // Create reservation
  const reservation = new Reservation(req.body, userId, needVerification, code, expires);
  const { newReservation, reservationID } = await reservation.createGuestReservation();

  const message = `Vaš jednokratni kod za potvrdu rezervacije.\n${code}\nKod ističe za 10min. Molimo vas da ga iskoristite pre isteka kako bi potvrdili vašu rezervaciju.\nUnapred hvala.`;

  if(needVerification) {
    try {
      /* await sendEmail({
        email: newGuest.data.email,
        subject: `Reserve&Go kod za potvrdu rezervacije: ${code}`,
        message
      }); */

      res.status(200).json({
        status: 'success',
        message: 'Confirmation code sent to email!',
        reservation: reservationID
      });
    } catch(err) {
      return next(new AppError('There was an error sending the email! Please try again later!', 500));
    }
  } else {
    res.status(200).json({
      status: 'success',
      message: 'Reservation created successfully!'
    });
  }
});


exports.verifyGuestReservation = catchAsync(async (req, res, next) => {
  const reservation = new Reservation(req.body);

  const reservationRows = await reservation.verifyGuestReservation();

  if (!reservationRows.length) return next(new AppError('Invalid reservation or already verified!', 400));
  if (new Date() > reservationRows[0].verification_code_expires_at) return next(new AppError('Code expired!', 400));
  if (reservationRows[0].verification_code !== reservation.data.code) return next(new AppError('Invalid code!', 400));

  const isReservatioConfirmed = await Reservation.confirmGuestReservation(reservation.data.reservationId);
  const isReservatioOwnerConfirmed = await User.confirmReservationOwner(reservationRows[0].guest_id);

  if(isReservatioConfirmed && isReservatioOwnerConfirmed) {
    // generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');  // 64 chars
    const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 24h

    const reservationAccommodationOwner = await Reservation.updateOwnerConfirmationToken(token, expires, reservation.data.reservationId);
    const { email } = await User.getAccommodationOwnerEmailByBookingsId(reservation.data.reservationId);

    if (!email) return next(new AppError('We could not find accommodation owners email!', 400));

    if(reservationAccommodationOwner && email) {
      const confirmUrl = `${req.protocol}://${req.get('host')}${process.env.CUSTOM_PATH}/accommodation-owner/confirm-reservation?token=${token}`;
      const message = `Poštovani,\n za vas je pristigla nova rezervacija. Ako želite da je potvrdite, kliknite na dugme 'Potvrdi rezervaciju' ili na link: ${confirmUrl}`;
      const html = `Poštovani,<br> za vas je pristigla nova rezervacija. Ako želite da je potvrdite, kliknite na dugme 'Potvrdi rezervaciju'<br> <a href="${confirmUrl}" target="_blank">Potvrdi rezervaciju</a>`;

      try {
        /* await sendEmail({
          email: email,
          subject: `Reserve&Go Nova rezervacija od: ${'Novi gost'}`,
          message,
          html
        }); */
      } catch(err) {
        return next(new AppError('There was an error sending the email! Please try again later!', 500));
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Reservation and Guest successfully confirmed!'
    });
  } else {
    res.status(500).json({
      status: 'failed',
      message: 'There was confirmation problems!'
    });
  }
});


exports.resendConfirmationCode = catchAsync(async (req, res, next) => {
  const { reservationId } = req.body;

  if (!reservationId) return next(new AppError('Missing reservation ID!', 400));

  const reservation = await Reservation.findReservationById(reservationId);

  if (!reservation) return next(new AppError('Reservation not found!', 404));
  if (reservation.verified) return next(new AppError('Reservation already verified!', 400));

  const now = new Date();

  // Rate-limit: allow resend only every 2 minutes
  if (reservation.verification_code_last_sent && now - new Date(reservation.verification_code_last_sent) < 2 * 60 * 1000) {
    return next(new AppError('Please wait 2min before requesting another code!', 429));
  }

  // Always generate a brand-new code
  const newCode = generateCode();
  const newExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const updateReservation = await Reservation.updateReservationVerificationCode(newCode, newExpiry, reservationId);
  const reservationOwner = await User.checkUser(reservation.guest_id);

  if (!reservationOwner) {
    return next(new AppError('We could not find reservation owner', 404));
  }

  const message = `Vaš novi jednokratni kod za potvrdu rezervacije.\n${newCode}\nKod ističe za 10min. Molimo vas da ga iskoristite pre isteka kako bi potvrdili vašu rezervaciju.\nUnapred hvala.`;

  if(updateReservation) {
    try {
      /* await sendEmail({
        email: reservationOwner.email,
        subject: `Reserve&Go novi kod za potvrdu rezervacije: ${newCode}`,
        message
      }); */

      res.status(200).json({
        status: 'success',
        message: 'Confirmation code sent to email!'
      });
    } catch(err) {
      return next(new AppError('There was an error sending the email! Please try again later!', 500));
    }
  } else {
    return next(new AppError('Faild to update confirmation code', 500));
  }
});