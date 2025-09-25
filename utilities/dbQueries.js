let dbQuery = {
  findUserByEmail: () => {
    return `
      SELECT * FROM users WHERE email = ? LIMIT 1
    `;
  },
  findUserById: () => {
    return `
      SELECT * FROM users WHERE id = ? LIMIT 1
    `;
  },
  findAccommodationByOwnerId: () => {
    return `
      SELECT id, name FROM accommodation_units WHERE owner_id = ?
    `;
  },
  createGuestUser: () => {
    return `
      INSERT INTO users (id, fullName, email, phone, password) VALUES (?,?,?,?,?)
    `;
  },
 createGuestReservation: () => {
    return `
      INSERT INTO bookings (id, startDate, endDate, numNights, numGuests, accommodationPrice, accommodationPriceWithDiscount, totalPrice, discount, verification_code, verification_code_expires_at, verified, accommodation_id, accommodation_owner_id, guest_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
  },
  verifyGuestReservation: () => {
    return `
      SELECT guest_id, verification_code, verification_code_expires_at, verified
      FROM bookings b
      JOIN users u ON u.id = b.guest_id
      WHERE b.id = ? AND b.verified = 0
    `;
  },
  confirmGuestReservation: () => {
    return `
      UPDATE bookings SET verified = 1 WHERE id = ?
    `;
  },
  confirmReservationOwner: () => {
    return `
      UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ?
    `;
  },
  isUserVerified: () => {
    return `
      SELECT * FROM users WHERE id = ? AND email_verified_at IS NOT NULL
    `;
  },
  checkPendingReservations: () => {
    return `
      SELECT COUNT(*) as pending_count FROM bookings 
      WHERE guest_id = ? 
      AND status = 'pending';
    `;
  },
  findReservationById: () => {
    return `
      SELECT * FROM bookings WHERE id = ?;
    `;
  },
  updateReservationVerificationCode: () => {
    return `
      UPDATE bookings
      SET verification_code = ?, verification_code_expires_at = ?, verification_code_last_sent = NOW()
      WHERE id = ?
    `;
  },
  updateOwnerConfirmationToken: () => {
    return `
      UPDATE bookings
      SET owner_confirm_token = ?, owner_token_expires = ?
      WHERE id = ?
    `;
  },
  findAccommodationOwnerEmailByBookingsId: () => {
    return `
      SELECT email
      FROM users u
      JOIN bookings b ON u.id = b.accommodation_owner_id
      WHERE b.id = ?
    `;
  },
  getReservationByOwnerToken: () => {
    return `
      SELECT id, guest_id FROM bookings
      WHERE owner_confirm_token = ?
      AND owner_confirmed = 0
      AND (owner_token_expires IS NULL OR owner_token_expires > NOW())
    `;
  },
  confirmReservationByAccommodationOwner: () => {
    return `
      UPDATE bookings
      SET owner_confirmed = 1,
          owner_confirm_token = NULL,
          owner_token_expires = NULL,
          status = 'confirmed'
      WHERE id = ?
    `;
  },
}

module.exports = dbQuery;