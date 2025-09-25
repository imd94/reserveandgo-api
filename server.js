require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCPTION! Shutting down...');
  console.log(err.name, err.message);
  
  process.exit(1);
});

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

async function shapeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`CREATE TABLE users (
      id char(36) NOT NULL DEFAULT (uuid()),
      fullName varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      email_verified_at timestamp NULL DEFAULT NULL,
      avatar varchar(45) DEFAULT NULL,
      role enum('superadmin','client','guest') DEFAULT 'guest',
      password varchar(255) NOT NULL,
      password_reset_token varchar(100) DEFAULT NULL,
      password_reset_expires timestamp NULL DEFAULT NULL,
      password_changed_at timestamp NULL DEFAULT NULL,
      remember_token varchar(100) DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY email_UNIQUE (email),
      UNIQUE KEY avatar_UNIQUE (avatar)
    );`);
    connection.release();
  } catch (error) {
    console.error('Error shaping database:', error);
    throw error;
  }
}

async function start() {
  try {
    //await shapeDatabase();
    module.exports = pool;
    
    const app = require("./app");

    // Add your routes and middleware here
    // app.get('/', (req, res) => {
    //   res.send('Hello, world!');
    // });

    const server = app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

    process.on('unhandledRejection', err => {
      console.log('UNHANDLED REJECTION! Shutting down...');
      console.log(err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Error starting application:', error);
  }
}

start();