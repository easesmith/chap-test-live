const express = require("express");
const {userAuth} = require('../middleware/auth');

const router = express.Router();

const authCountroller = require("../controllers/auth");

router.get("/get-user/:userId", userAuth, authCountroller.getUser);
router.post("/add-user", authCountroller.postAddUser);
router.post("/login", authCountroller.loginUser);

router.post("/send-otp", authCountroller.sendOTP);


router.post("/logout", authCountroller.logoutUser);



module.exports = router;
