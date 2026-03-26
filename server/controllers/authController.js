const login = (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith("@nu.edu.pk")) {
    return res.status(400).json({ message: "Invalid email. Please use your university email." });
  }

  res.status(200).json({ message: "Login successful" });
};

module.exports = { login };