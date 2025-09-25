require('dotenv').config({ quiet: true });
const apiRouter = require('express').Router();
const authController = require("./controllers/authController");
const userController = require("./controllers/userController");
const accommodationController = require("./controllers/accommodationController");
const reservationController = require("./controllers/reservationController");
const settingsController = require("./controllers/settingsController");
const cors = require('cors');

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [];

const corsDefault = {
  origin: process.env.RESERVE_AND_GO_ADMIN_ORIGIN,   // React app URL
  credentials: true,                  // for cookies
}
const guestCors = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
};

// Preflight cors
apiRouter.options('/login', cors(corsDefault));
apiRouter.options('/create-guest-reservation', cors(guestCors));
apiRouter.options('/verify-guest-reservation', cors(guestCors));
apiRouter.options('/reservations/resend-confirmation-code', cors(guestCors));

apiRouter.get("/", cors(corsDefault), (req, res) => res.json("Hello, if you see this message that means your backend is up and running successfully."));
apiRouter.get("/auth-check", cors(corsDefault), authController.isLoggedIn);
apiRouter.post("/login", cors(corsDefault), authController.login);
apiRouter.get("/logout", cors(corsDefault), authController.logout);
apiRouter.get("/accommodation-owner/confirm-reservation", cors(corsDefault), userController.reservationConfirmByOwner);

apiRouter.get("/accommodation-units/:owner", cors(guestCors), accommodationController.getAccommodationByOwner);
apiRouter.post("/create-guest-reservation", cors(guestCors), reservationController.createGuestReservation);
apiRouter.post("/verify-guest-reservation", cors(guestCors), reservationController.verifyGuestReservation);
apiRouter.post("/reservations/resend-confirmation-code", cors(guestCors), reservationController.resendConfirmationCode);

module.exports = apiRouter;