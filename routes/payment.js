const express = require("express");
const {userAuth} = require('../middleware/auth');
const isCity=require("../middleware/availableCity")

//imprting contoller
const paymentController = require("../controllers/payments");

const router = express.Router();
router.post("/checkout", userAuth, paymentController.paymentCheckout);
router.post(
  "/payment-verification",
  paymentController.paymentVerification
);
router.get("/get-payment-key", userAuth, paymentController.getPaymentKey);

router.post("/cod-checkout", userAuth,
  // isCity.isCityAvailable,
  paymentController.codOrder);




module.exports = router;
