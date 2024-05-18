const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Cart = require("../models/cart");
const Sku = require("../models/sku");

const authHelper = require("../util/authHelper");
const { setTokenToCookies } = require("../util/jwtHelper");

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postAddUser = async (req, res, next) => {
  try {
    const { name, phone, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User is already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(phone, 10);

    // Create a new user
    const user = new User({ name, phone, password: hashedPassword, gender });

    // Save the user
    await user.save();

    // Create a new cart for the user
    const newCart = new Cart({ userId: user._id });
    await newCart.save();

    // Assign cart ID to the user
    user.cartId = newCart._id;
    await user.save();

    // Process guest cart items
    const userCart = await Cart.findOne({ userId: user._id });
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items; //array
      console.log("cart items == ", carItems);
      for (const guestCartItem of carItems) {
        const skuId = await Sku.findOne({ _id: guestCartItem.skuId });

        if (!skuId) {
          return res.status(400).json({ message: "Sku not found" });
        }
        userCart.items.push(guestCartItem);
      }
      // Save the user cart
      await userCart.save();
      // Recalculate the total value of the user's cart
      const skus = await Cart.findOne({ userId: user._id }).populate({
        path: "items.skuId",
        model: "Sku",
      });
      userCart.totalValue = skus.items.reduce(
        (total, item) => total + item.quantity * item.skuId.price,
        0
      );

      await userCart.save();
    }
    res.status(200).json({
      message: "Sign up successful",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postAddUserAddress = (req, res, next) => {
  const userId = req.body.userId;
  const pincode = req.body.pincode;
  const addressLine = req.body.addressLine;
  const state = req.body.state;
  const city = req.body.city;

  User.findById(userId)
    .then((user) => {
      user.address = {
        addressLine: addressLine,
        pincode: pincode,
        state: state,
        city: city,
      };
      return user.save();
    })
    .then((user) => {
      res.status(200).json({ user: user });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    });
};

exports.loginUser = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "User doesn't exist" });
    }

    // // Verify OTP and check the expiration time
    const verifyOTP = await User.findOne({
      phone,
      otp,
      otpExpiresAt: { $gt: new Date() },
    });

    if (!verifyOTP) {
      return res.status(400).json({ message: "Invalid OTP or it is expired" });
    }

    // Remove OTP and expiration time
    await User.findOneAndUpdate(
      { phone },
      { $unset: { otp: true, otpExpiresAt: true } }
    );

    // Add cart items as a guest user to the existing user's cart
    const userCart = await Cart.findOne({ userId: user._id });
    console.log("userCart -- ", userCart);

    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items; //array
      console.log("cart items == ", carItems);
      for (const guestCartItem of carItems) {
        const skuId = await Sku.findOne({ _id: guestCartItem.skuId });

        if (!skuId) {
          return res.status(400).json({ message: "Sku not found" });
        }

        const existingCartItem = userCart.items.find((item) =>
          item.skuId.equals(guestCartItem.skuId)
        );

        if (existingCartItem) {
          existingCartItem.quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      }

      // Recalculate the total value of the user's cart
      const skus = await Cart.findOne({ userId: user._id }).populate({
        path: "items.skuId",
        model: "Sku",
      });
      userCart.totalValue = skus.items.reduce(
        (total, item) => total + item.quantity * item.skuId.price,
        0
      );

      await userCart.save();
      res.clearCookie("guestCart");
    }

    // Generate JWT token
    const payload = { phone: user.phone, id: user._id,name:user.name };
    setTokenToCookies(payload,res);

    res.status(200).json({
      message: "Logged In",
      success: true,
      payload
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    console.log("hello");
    const phone = req.body.phone;

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = authHelper.generateOTP();

    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updateUser = await User.findOneAndUpdate(
      { phone: phone },
      { otp: otp, otpExpiresAt: otpExpiresAt },
      { upsert: true, new: true }
    );

    if (!updateUser) {
      return res.status(400).json({
        message: "Could not save otp",
      });
    }

    res.status(200).json({
      message: "OTP sent successfully",
      otp: otp,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Something went wrong while sending otp",
      error: error.message,
    });
  }
};



exports.logoutUser = async (req, res) => {
  try {

    res.clearCookie("token");
    res.clearCookie("user");

    res.status(200).json({
      message: "User is logged out",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong while logging out",
    });
  }
};
