require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB();

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on port ${PORT}`);
});