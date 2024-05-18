const jwt = require("jsonwebtoken");
const User = require("../models/user");



exports.userAuth = async (req, res, next) => {
  console.log("user auth");
  try {
    //check if the token has recieved or not
    const token = req.cookies["token"];
    //token is missing

    jwt.verify(token, process.env.JWT_SECRET, async function (err, authData) {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(400).json({
            message: "Token expired! Please Login in Again",
            tokenExpired: true,
          });
        }
        return res.status(400).json({
          message: "Token is not valid",
        });
      } else {
        const userId = authData.id;
        const user = await User.findById(userId);
        req.user = user;
        next();
      }
    });

    // const validatedToken = await jwt.verify(token, process.env.JWT_SECRET);
    //   console.log(validatedToken);
    //   const userId = validatedToken.id;
    //   const user = await User.findById(userId);
    //   req.user = user;
    // next();
  } catch (err) {
    console.log(err);
    // return res.status(500).json({
    //   message: "user auth middleware error",
    // });
  }
};

exports.userAuthForCart = async (req, res, next) => {
  try {
    const token = req.cookies["token"];
    //token is missing
    try {
      if (token) {
        const validatedToken = await jwt.verify(token, process.env.JWT_SECRET);
        const userId = validatedToken.id;
        const user = await User.findById(userId);
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({
          message: "Token expired",
          tokenExpired: true,
        });
      }
      return res.status(401).json({
        message: "Invalid Token",
        success: false,
      });
    }
    //if token is valid move on to next middleware
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

