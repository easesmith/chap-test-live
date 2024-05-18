const rentPlantModel = require('../../models/services model/rentPlant')
const userModel = require('../../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { setTokenToCookies } = require('../../util/jwtHelper')
require('dotenv').config()
exports.createRentPlant = async (req, res) => {
  try {
    const {
      date,
      name,
      phone,
      Plants,
      Totalvalue,
      time,
      description,
      address,
      customerId,
      status
    } = req.body
    const { state, city, addressLine, pincode } = address
    if (
      !date ||
      !name ||
      !phone ||
      !Totalvalue ||
      !time ||
      !description ||
      !customerId ||
      !state ||
      !city ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    }

    const result = await userModel.findOne({ phone: phone }) 
    
    if (result) {
      await rentPlantModel.create({
        userId: result._id,
        name: name,
        date: date,
        phone: phone,
        Totalvalue:Totalvalue,
        Plants: Plants,
        time: time,
        description: description,
        address: address,
        customerId: customerId,
        status
      })
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
              .json({ success: false, message: 'password encryption error' })
          } else {
            const user = await userModel.create({
              name: name,
              phone: phone,
              password: hash
            })
            await rentPlantModel.create({
              userId: user._id,
              name: name,
              date: date,
              phone: phone,
              Plants: Plants,
              time: time,
              description: description,
              address: address,
              customerId: customerId,
              status
            })

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
        })
      })
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

exports.userRentPlant = async (req, res) => {
  try {
    const id = req.params.id // userid
    const result = await rentPlantModel.findOne({ userId: id })
    res
      .status(201)
      .json({ success: true, message: 'User rent plant', data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

exports.cancelRentPlant = async (req, res) => {
  try {
    const id = req.params.id // order id
    let result = await rentPlantModel.findOne({ _id: id })
    result.status = 'cancelled'
    await result.save()
    res
      .status(200)
      .json({ success: true, message: 'Order canceled successful' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
