const MaliService = require("../../models/services model/Mali");
const userModel = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { setTokenToCookies } = require("../../util/jwtHelper");
require("dotenv").config();

exports.postMaliService = async (req, res, next) => {
  try {
    console.log(req.body);
    const {
      date,
      type,
      name,
      phone,
      basics,
      time,
      description,
      address,
      noOfWeeks,
      totalAmount,
    } = req.body;
    const { state, city, addressLine1, addressLine2, pincode } = address;

    if (
      !date ||
      !type ||
      !name ||
      !phone ||
      !basics ||
      !time ||
      !state ||
      !city ||
      !pincode ||
      !totalAmount
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    }

    const result = await userModel.findOne({ phone: phone });
    if (result) {
      await MaliService.create({
        date: date,
        type: type,
        basics: basics,
        time: time,
        noOfWeeks: noOfWeeks,
        totalAmount: totalAmount,
        description: description,
        name: name,
        phone: phone,
        address: {
          state: state,
          city: city,
          addressLine1: addressLine1,
          addressLine2: addressLine2,
          pincode: pincode,
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
            await MaliService.create({
              date: date,
              type: type,
              basics: basics,
              time: time,
              noOfWeeks: noOfWeeks,
              totalAmount: totalAmount,
              description: description,
              name: name,
              phone: phone,
              address: {
                state: state,
                city: city,
                addressLine1: addressLine1,
                addressLine2: addressLine2,
                pincode: pincode,
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
  } catch (err) {
    console.log("err--->", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.userMaliService = async (req, res) => {
  try {
    const id = req.user._id; // userid
    const page = req.query.page || 1;
    const limit = req.query.limit || 12;
    const result = await MaliService.find({ userId: id })
      .skip((page - 1) * limit)
      .limit(limit);
    const count = await MaliService.find({ userId: id }).length();
    res.status(201).json({
      success: true,
      message: "User mali service",
      data: result,
      count: count,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.cancelMaliService = async (req, res) => {
  try {
    const id = req.params.id; // order id
    let result = await MaliService.findOne({ _id: id });
    result.status = "cancelled";
    await result.save();
    res
      .status(200)
      .json({ success: true, message: "Mali service canceled successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
