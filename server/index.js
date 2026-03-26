const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const bookingRoutes = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/bookings", bookingRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});