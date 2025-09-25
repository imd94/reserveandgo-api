const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    logger: true,
    secure: false,
    // Activate in gmail less secure app
  });

  // 2. Define the email option
  const mailOptions = {
    from: 'Reserve & Go <ivan94mirkovic@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  }

  // 3. Actually send an email
  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;