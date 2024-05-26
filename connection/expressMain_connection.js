const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = require("../server");
const bodyParser = require("body-parser");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const shopRoute = require("../routes/shop");
const authRoute = require("../routes/auth");
const paymentRoute = require("../routes/payment");
const serviceRoute = require("../routes/services");
const errorHandler = require("../controllers/errorController.js");

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.FrontEnd_URL,
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use("/api/shop", shopRoute);
app.use("/api/auth", authRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/services", serviceRoute);

app.use("/images", express.static(path.join(__dirname, "../", "../images")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../", "build", "index.html"));
});

app.use(errorHandler);
