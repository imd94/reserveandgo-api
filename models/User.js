const pool = require("./../server");
const dbQuery = require('./../utilities/dbQueries'); 
const AppError = require('./../utilities/appError');
const validator = require("validator");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


let User = function(data) {
  this.data = data;
  this.errors = [];
}

User.prototype.loginInputCleanup = function() {
  if(typeof(this.data.email) != 'string') { this.data.email = ''; }
  if(typeof(this.data.password) != 'string') { this.data.password = ''; }

  this.data = {
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

User.prototype.validateLoginInfo = async function() {
  if(!this.data.email || !this.data.password) { this.errors.push('Please provide an email and password!'); }
}

User.prototype.login = async function() {
  this.loginInputCleanup();

  try {
    const [[attemptedUser]] = await pool.execute(dbQuery.findUserByEmail(), [this.data.email]);

    if(!attemptedUser || !(await bcrypt.compare(this.data.password, attemptedUser.password))) {
      this.errors.push('Incorrect email or password!');
    } else {
      return attemptedUser;
    }
  } catch(error) {
    console.error('Database error (Login)', error);
    throw error;
  }
}

User.prototype.createGuestUser = async function() {
  const currentPass = randomPassword();
  console.log('Password: ', currentPass);
  const hashedPassword = await bcrypt.hash(currentPass, 12);
  const id = uuidv4();

  try {
    const [newGuestUser] = await pool.execute(dbQuery.createGuestUser(), [id, this.data.fullName, this.data.email, this.data.phone, hashedPassword]);
    
    return { newGuestUser, id };
  } catch(error) {
    console.error('Database error (Failed to cerate new guest user!)', error);
    throw error;
  }
}

User.checkUser = async function(userID) {
  try {
    const [[currentUser]] = await pool.execute(dbQuery.findUserById(), [userID]);
    return currentUser;
  } catch(error) {
    console.error('Database error (User check)', error);
    throw error;
  }
}

User.findUserByEmail = async function(userEmail) {
  try {
    const [[currentUser]] = await pool.execute(dbQuery.findUserByEmail(), [userEmail]);
    return currentUser;
  } catch(error) {
    console.error('Database error (User check by email)', error);
    throw error;
  }
}

User.checkIfUserIsVerified = async function(userId) {
  try {
    const [[verifiedUser]] = await pool.execute(dbQuery.isUserVerified(), [userId]);
    if(verifiedUser) {
      return true;
    } else {
      return false;
    }
  } catch(error) {
    console.error('Database error (User verify check)', error);
    throw error;
  }
}

User.confirmReservationOwner = async function(reservationOwnerId) {
  try {
    const [checkUser] = await pool.execute(dbQuery.confirmReservationOwner(), [ reservationOwnerId ]);
    if(checkUser) {
      return true;
    } else {
      return false
    }
  } catch(error) {
    console.error('Database error (Failed to confirm user!)', error);
    throw error;
  }
}

User.getAccommodationOwnerEmailByBookingsId = async function(reservationId) {
  try {
    const [[accommodationOwnerEmail]] = await pool.execute(dbQuery.findAccommodationOwnerEmailByBookingsId(), [ reservationId ]);
    return accommodationOwnerEmail;
  } catch(error) {
    console.error('Database error (Failed to get accommodation owner email!)', error);
    throw error;
  }
}

const randomPassword = (len = 12) => {
  return [...crypto.randomBytes(len)].map(b => (b % 36).toString(36)).join('');
}

module.exports = User;