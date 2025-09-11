const apiRouter = require('express').Router();
const cabinController = require("./controllers/cabinController");
const settingsController = require("./controllers/settingsController");
const guestController = require("./controllers/guestController");
const cors = require('cors');

apiRouter.use(cors());

apiRouter.get("/", (req, res) => res.json("Hello, if you see this message that means your backend is up and running successfully."));

// Cabins
apiRouter.get('/cabins', cabinController.getCabins);
apiRouter.get('/cabins/:id', cabinController.getCabin);
apiRouter.get('/cabins/:id/bookings', cabinController.getBookedDatesByCabinId);

// Settings
apiRouter.get('/settings', settingsController.getSettings);

// Guests
apiRouter.get('/guests', guestController.getGuests);
apiRouter.post('/guests/create', guestController.createNewGuest);
apiRouter.patch('/guest/:id/update', guestController.updateGuest);

module.exports = apiRouter;