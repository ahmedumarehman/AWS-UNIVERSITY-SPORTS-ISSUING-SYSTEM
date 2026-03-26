const fs = require("fs");
const path = require("path");
const Booking = require("../models/booking");

const bookingsFilePath = path.join(__dirname, "..", "data", "bookings.json");

const getBookings = (req, res) => {
  fs.readFile(bookingsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading bookings data." });
    }
    res.status(200).json(JSON.parse(data));
  });
};

const createBooking = (req, res) => {
  const { fullName, rollNumber, email, contactNumber, itemName, timeSlot } = req.body;

  fs.readFile(bookingsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading bookings data." });
    }

    const bookings = JSON.parse(data);
    const existingBooking = bookings.find(
      (booking) => booking.itemName === itemName && booking.timeSlot === timeSlot
    );

    if (existingBooking) {
      return res.status(400).json({ message: "This item is already booked for the selected time slot." });
    }

    const newBooking = new Booking(
      Date.now(),
      fullName,
      rollNumber,
      email,
      contactNumber,
      itemName,
      timeSlot
    );

    bookings.push(newBooking);

    fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Error saving booking." });
      }
      res.status(201).json({ message: "Your booking has been confirmed." });
    });
  });
};

const markBookingReturned = (req, res) => {
  const { id } = req.params;

  fs.readFile(bookingsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading bookings data." });
    }

    const bookings = JSON.parse(data);
    const bookingIndex = bookings.findIndex((booking) => String(booking.id) === String(id));

    if (bookingIndex === -1) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const selectedBooking = bookings[bookingIndex];

    if (selectedBooking.returnStatus === "Returned") {
      return res.status(200).json({ message: "Booking is already marked as Returned.", booking: selectedBooking });
    }

    bookings[bookingIndex] = {
      ...selectedBooking,
      returnStatus: "Returned",
      returnTime: new Date().toISOString(),
    };

    fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2), (writeErr) => {
      if (writeErr) {
        return res.status(500).json({ message: "Error updating booking return status." });
      }

      res.status(200).json({
        message: "Booking marked as Returned successfully.",
        booking: bookings[bookingIndex],
      });
    });
  });
};

const updateReturnStatus = () => {
  fs.readFile(bookingsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading bookings data:", err);
      return;
    }

    const bookings = JSON.parse(data);
    const now = new Date();

    bookings.forEach((booking) => {
      const bookingTime = new Date(booking.bookingTime);
      const diffInDays = (now - bookingTime) / (1000 * 60 * 60 * 24);

      if (diffInDays > 2 && booking.returnStatus === "Booked") {
        booking.returnStatus = "Late";
      }
    });

    fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2), (err) => {
      if (err) {
        console.error("Error updating bookings data:", err);
      }
    });
  });
};

setInterval(updateReturnStatus, 1000 * 60 * 60 * 24); // Check every 24 hours

module.exports = { getBookings, createBooking, markBookingReturned };