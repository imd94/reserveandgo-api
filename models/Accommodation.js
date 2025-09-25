const pool = require("./../server");
const dbQuery = require('./../utilities/dbQueries'); 
const AppError = require('./../utilities/appError');


let Accommodation = function(data) {
  this.data = data;
  this.errors = [];
}

Accommodation.getAccommodationByOwner = async function(ownerID) {
  try {
    const [accommodation] = await pool.execute(dbQuery.findAccommodationByOwnerId(), [ownerID]);
    return accommodation;
  } catch(error) {
    console.error('Database error (Trying to get accommodation by owner)', error);
    throw error;
  }
}

module.exports = Accommodation;