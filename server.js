const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});

const server = express();
server.use("/images", express.static(path.join(__dirname, "../", "images")));
server.use(express.static(path.join(__dirname, "build")));

const mongoose_url = process.env.TEST_MONGO_CONNECTION;

mongoose
  .connect(mongoose_url)
  .then((result) => {
    console.log("Chaperone database is connected");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 5000;

server.listen(port, function () {
  console.log(`Server is running on port http://localhost:${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err);
  console.log(err.name, err.message);

  process.exit(1);
});

module.exports = server;
