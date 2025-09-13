const pool = require("./../server");
const dbQuery = require('./../utilities/dbQueries'); 
const AppError = require('./../utilities/appError');
const validator = require("validator");
const bcrypt = require('bcrypt');


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

User.checkUser = async function(userID) {
  try {
    const [[currentUser]] = await pool.execute(dbQuery.findUserById(), [userID]);
    return currentUser;
  } catch(error) {
    console.error('Database error (User check)', error);
    throw error;
  }
}

module.exports = User;