const pool = require("./../server");

let Settings = function(data) {
  this.data = data;
  this.errors = [];
}

Settings.getSettings = async function() {
  try {
    const query = `
    SELECT 
    *
    FROM settings 
    `;
    const [settings] = await pool.execute(query);

    return settings;
  } catch(err) {
    throw err;
  }
};

module.exports = Settings;