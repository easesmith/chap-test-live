const PlantDayCareService = require("../../models/services model/daycare");
const userModel = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { setTokenToCookies } = require("../../util/jwtHelper");

exports.postAddPlantDayCare = async (req, res) => {
  try {
    const { date, name, phone, plants, totalvalue, time, noOfDays, address } =
      req.body;
    const { state, city, addressLine1, addressLine2, pincode } = address;

    if (
      !date ||
      !name ||
      !phone ||
      !time ||
      !state ||
      !city ||
      !pincode ||
      plants.length == 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    }

    const result = await userModel.findOne({ phone: phone });
    if (result) {
      await PlantDayCareService.create({
        date,
        name,
        phone,
        plants,
        totalvalue,
        time,
        noOfDays,
        address: {
          state,
          city,
          addressLine1,
          addressLine2,
          pincode,
        },
        userId: result._id,
      });

      const payload = {
        phone: result.phone,
        id: result._id,
        name: result.name,
      };
      setTokenToCookies(payload, res);
      res.status(200).json({
        message: "service successfully booked",
        success: true,
      });
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(phone, salt, async function (err, hash) {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: "password encryption error" });
          } else {
            const user = await userModel.create({
              name: name,
              phone: phone,
              password: hash,
            });
            await PlantDayCareService.create({
              date,
              name,
              phone,
              plants,
              totalvalue,
              time,
              noOfDays,
              address: {
                state,
                city,
                addressLine1,
                addressLine2,
                pincode,
              },
              userId: user._id,
            });

            const payload = {
              phone: user.phone,
              id: user._id,
              name: user.name,
            };
            setTokenToCookies(payload, res);
            res.status(200).json({
              message: "service successfully booked",
              success: true,
            });
          }
        });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.userPlantDayCare = async (req, res) => {
  try {
    const id = req.user._id; // userid
    const page = req.query.page || 1;
    const limit = req.query.limit || 12;
    const result = await PlantDayCareService.find({ userId: id })
      .skip((page - 1) * limit)
      .limit(limit);
    const count = await PlantDayCareService.count({ userId: id });
    res.status(201).json({
      success: true,
      message: "User plant day care service",
      data: result,
      count: count,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.cancelDayCare = async (req, res) => {
  try {
    const id = req.params.id; // order id
    let result = await PlantDayCareService.findOne({ _id: id });
    result.status = "cancelled";
    await result.save();
    res
      .status(200)
      .json({ success: true, message: "Day care service canceled successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
