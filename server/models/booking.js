class Booking {
  constructor(id, fullName, rollNumber, email, contactNumber, itemName, timeSlot) {
    this.id = id;
    this.fullName = fullName;
    this.rollNumber = rollNumber;
    this.email = email;
    this.contactNumber = contactNumber;
    this.itemName = itemName;
    this.timeSlot = timeSlot;
    this.bookingTime = new Date();
    this.returnStatus = "Booked";
  }
}

module.exports = Booking;