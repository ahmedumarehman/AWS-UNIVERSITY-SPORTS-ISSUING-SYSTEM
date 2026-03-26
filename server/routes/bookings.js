const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.get("/", bookingController.getBookings);
router.post("/", bookingController.createBooking);
router.patch("/:id/return", bookingController.markBookingReturned);

module.exports = router;