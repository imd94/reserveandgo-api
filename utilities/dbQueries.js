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
  }
}

module.exports = dbQuery;