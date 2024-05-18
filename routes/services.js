const express = require("express");

const router = express.Router();
const {userAuth} = require('../middleware/auth');

const maliController = require("../controllers/services/mali");
const plantDayCareController = require("../controllers/services/day_care");
const rentPlant_controller=require("../controllers/services/rentPlant")

router.post("/post-mali-service", maliController.postMaliService);
router.get("/user-mali-service",userAuth,maliController.userMaliService) // passing user id
router.get("/cancel-mali-service/:id",userAuth, maliController.cancelMaliService); // passing order id

router.post(
  "/post-plant-day-care-service",
  plantDayCareController.postAddPlantDayCare
);
router.get("/user-plant-day-care",userAuth,plantDayCareController.userPlantDayCare) // passing user id
router.get("/cancel-day-care/:id",userAuth,plantDayCareController.cancelDayCare) // passing order id

// *
router.post("/create-rent-plant",rentPlant_controller.createRentPlant);
router.get("/get-user-rent-plant/:id",userAuth,rentPlant_controller.userRentPlant); // passing user id
router.get("/cancel-rent-plant/:id", userAuth,rentPlant_controller.cancelRentPlant); 
module.exports = router;
