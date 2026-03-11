
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const routes = require("./routes/index");



dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("MakaoLink API Running...");
});

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});