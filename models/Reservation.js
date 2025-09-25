const pool = require("./../server");
const dbQuery = require('./../utilities/dbQueries'); 
const AppError = require('./../utilities/appError');
const { v4: uuidv4 } = require('uuid');


let Reservation = function(data, userId, needVerification, code, expires) {
  this.data = data;
  this.userId = userId;
  this.needVerification = needVerification;
  this.code = code ?? null;
  this.expires = expires ?? null;
  this.errors = [];
}

Reservation.prototype.createGuestReservation = async function() {
  try {
    console.log(this.data);
    console.log(this.userId, this.needVerification, this.code, this.expires);
    const id = uuidv4();

    const [newReservation] = await pool.execute(dbQuery.createGuestReservation(), [
      id,
      new Date(this.data.startDate),
      new Date(this.data.endDate),
      this.data.numNights,
      Number(this.data.numGuests),
      this.data.accommodationPrice,
      this.data.accommodationPriceWithDiscount,
      this.data.totalPrice,
      this.data.discount,
      this.needVerification ? this.code : null,
      this.needVerification ? new Date(this.expires) : null,
      this.needVerification ? 0 : 1,
      this.data.accommodationId,
      this.data.accommodationOwnerId,
      this.userId
    ]);
    return { newReservation, reservationID: id };
  } catch(error) {
    console.error('Database error (Failed to cerate new guest user!)', error);
    throw error;
  }
}

Reservation.prototype.verifyGuestReservation = async function() {
  try {
    const [guestReservation] = await pool.execute(dbQuery.verifyGuestReservation(), [
      this.data.reservationId
    ]);
    return guestReservation;
  } catch(error) {
    console.error('Database error (Failed to verify reservation!)', error);
    throw error;
  }
}

Reservation.confirmGuestReservation = async function(reservationId) {
  try {
    const [checkReservation] = await pool.execute(dbQuery.confirmGuestReservation(), [ reservationId ]);
    if(checkReservation) {
      return true;
    } else {
      return false;
    }
  } catch(error) {
    console.error('Database error (Failed to confirm reservation!)', error);
    throw error;
  }
}

Reservation.checkPendingReservations = async function(userId) {
  try {
    const [[pendingReservations]] = await pool.execute(dbQuery.checkPendingReservations(), [ userId ]);
    return pendingReservations;
  } catch(error) {
    console.error('Database error (Failed to fetch pending reservation!)', error);
    throw error;
  }
}

Reservation.findReservationById = async function(reservationId) {
  try {
    const [[reservation]] = await pool.execute(dbQuery.findReservationById(), [ reservationId ]);
    return reservation;
  } catch(error) {
    console.error('Database error (Failed to fetch unverified reservation!)', error);
    throw error;
  }
}

Reservation.updateReservationVerificationCode = async function(newCode, newExpiry, reservationId) {
  try {
    const [reservation] = await pool.execute(dbQuery.updateReservationVerificationCode(), [ newCode, newExpiry, reservationId ]);

    if(!reservation) {
      return false;
    }

    return true;
  } catch(error) {
    console.error('Database error (Failed to update reservation verification code!)', error);
    throw error;
  }
}

Reservation.updateOwnerConfirmationToken = async function(token, expires, bookingId) {
  try {
    const [reservation] = await pool.execute(dbQuery.updateOwnerConfirmationToken(), [ token, expires, bookingId ]);

    if(!reservation) {
      return false;
    }

    return true;
  } catch(error) {
    console.error('Database error (Failed to update reservation accommodation owner token!)', error);
    throw error;
  }
}

Reservation.getReservationByOwnerToken = async function(token) {
  try {
    const [[reservation]] = await pool.execute(dbQuery.getReservationByOwnerToken(), [ token ]);

    return reservation;
  } catch(error) {
    console.error('Database error (Failed to get reservation by owner token!)', error);
    throw error;
  }
}

Reservation.confirmReservationByAccommodationOwner = async function(reservationId) {
  try {
    const [reservation] = await pool.execute(dbQuery.confirmReservationByAccommodationOwner(), [ reservationId ]);

    if(!reservation) {
      return false;
    }

    return true;
  } catch(error) {
    console.error('Database error (Failed to update reservation accommodation owner token!)', error);
    throw error;
  }
}

module.exports = Reservation;