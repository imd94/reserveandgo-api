require('dotenv').config();
const apiRouter = require('express').Router();
const authController = require("./controllers/authController");
const settingsController = require("./controllers/settingsController");
const cors = require('cors');

apiRouter.use(cors({
  origin: process.env.RESERVE_AND_GO_ORIGIN,   // React app URL
  credentials: true                  // for cookies
}));

//apiRouter.use(authController.isLoggedIn);

apiRouter.get("/", (req, res) => res.json("Hello, if you see this message that means your backend is up and running successfully."));
//apiRouter.get("/auth-check", authController.authCheck, authController.isAuth);
apiRouter.get("/auth-check", authController.isLoggedIn);
apiRouter.post("/login", authController.login);
apiRouter.get("/logout", authController.logout);

module.exports = apiRouter;