const Razorpay = require("razorpay");
var crypto = require("crypto");
const mongoose = require("mongoose");
// const { configDotenv } = require("dotenv");
const { configDotenv } = require("dotenv");
configDotenv({ path: "../config/config.env" });
const fs = require("fs");
const path = require("path");

//Importing Models
const UserAddress = require("../models/useraddress");
const Nursery = require("../models/nursery");
const Sku = require("../models/sku");
const User = require("../models/user");
const Order = require("../models/order");
const Payment = require("../models/payments");
const Cart = require("../models/cart");
const SellerOrder = require("../models/sellerorder");
const {
  getInvoiceData,
  getCurrentDate,
  getDeliveryDate,
} = require("../util/invoiceData");
const easyinvoice = require("easyinvoice");
// test credentials
const razorPayKeyId = "rzp_test_XtC1VoPYosmoCP";
const razorKeySecret = "olIq40GreBPUaEz80552bG2f";

///

exports.trackUserOrder = async (userDetails) => {
  try {
    console.log("userDetails", userDetails);

    if (userDetails) {
      const trackUser = await SellerOrder.create({
        userOrderId: userDetails.orderId,
        products: userDetails.products,
        nurseryId: userDetails.nurseryId,
        totalPrice: userDetails.totalPrice,
        orderStatus: "placed",
      });

      // console.log("seller order has been created ==", trackUser);
    } else {
      throw new Error("No Details found");
    }
  } catch (err) {
    console.log(err);
  }
};
const instance = new Razorpay({
  key_id: razorPayKeyId,
  key_secret: razorKeySecret,
});

const CartToOrder = async (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) => {
  try {
    // Find the user by their user ID
    const user = await User.findOne({
      razorPayOrderId: razorpay_order_id,
    }).populate({
      path: "cartId",
      model: "Cart",
    }); // Populate the 'cart' field
    // console.log("USER", user);

    const userAddressIndex = user.tempAddressId;
    const cart = await Cart.findOne({ userId: user._id }).populate(
      "items.skuId"
    );

    // Populate the 'cart' field
    // console.log("CART", cart);
    // if (!user) {
    //   return res.status(404).json({ message: "User not found." });
    // }

    // Extract cart data from the user's cart
    const items = cart.items;

    // Create an array to store order items
    const orderItems = [];

    // Process and add plant items to the order
    for (const productItem of items) {
      // console.log("PRO ITEM", productItem);
      const sku = await Sku.findById(productItem.skuId._id.toString()).populate(
        {
          path: "productId",
          model: "Product",
        }
      );

      // console.log('SKU',sku)

      if (sku) {
        let item = { ...sku.productId._doc };
        // console.log("ITEM", item);
        item["price"] = sku.price;
        item["colour"] = productItem.quantity;
        item["size"] = sku.size;
        item["availableIn"] = sku.availableIn;
        orderItems.push({
          type: item.type,
          product: item,
          quantity: productItem.quantity,
        });
      }
    }
    const userIdObject = new mongoose.Types.ObjectId(user._id.toString());

    const userAddressDoc = await UserAddress.findOne({ userId: userIdObject });

    // console.log("userAddressId", userAddressIndex);

    const add = userAddressDoc.addresses[userAddressIndex];

    // console.log("addd", add);

    // Create a new order instance
    const order = new Order({
      paymentType: "Online payment",
      orderValue: cart.totalValue,
      products: orderItems,
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          address_line1: add.address_line1,
          address_line2: add.address_line2,
          city: add.city,
          state: add.state,
          pincode: add.pincode,
        },
      },
    });

    // Save the order to the database

    await order.save();

    const newNurseryIds = [
      ...new Set(orderItems.map((item) => item.product.nurseryId.toString())),
    ];

    const productItems = orderItems
      // .filter((item) => item.type === "Plant")
      .map((item) => ({
        type: item.type,
        product: item.product,
        quantity: item.quantity,
      }));

    // console.log("productItems ====== ", productItems);

    for (const id of newNurseryIds) {
      let productDetails = [];
      const orderedProduct = productItems.filter(
        (ele) => ele.product.nurseryId.toString() === id
      );
      // console.log("orderedProduct === ", orderedProduct);
      const totalPrice = orderedProduct.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      // console.log("totalPrice ===== ", totalPrice);
      const newValue1 = orderedProduct.map((item) => ({
        type: item.type,
        productId: item.product._id,
        quantity: item.quantity,
      }));
      // console.log("newValue1 == ", newValue1);
      productDetails = {
        orderId: order._id,
        products: newValue1,
        nurseryId: new mongoose.Types.ObjectId(id),
        totalPrice: totalPrice,
      };
      this.trackUserOrder(productDetails);
      // console.log("seller order == ", productDetails);
    }

    // retrieving quantity price and name of he product

    const pdf = await getUserInvoice(order);
    // console.log(pdf)
    // Clear the user's cart after creating the order

    // Clear the user's cart after creating the order
    cart.items = [];
    cart.totalValue = 0;
    await cart.save();

    user.razorPayOrderId = null;
    user.tempAddressId = null;

    await user.save();

    const paymentData = new Payment({
      user: user._id,
      order: order._id,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      amount: order.orderValue,
    });

    await paymentData.save();
    // Send a success response
    return { message: "Order created successfully." };
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

exports.getPaymentKey = async (req, res, next) => {
  res.status(200).json({ key: razorPayKeyId });
};
exports.paymentVerification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", razorKeySecret)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;
  if (isAuthentic) {
    await CartToOrder(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    res.redirect(
      `${process.env.PAYMENT_REDIRECT_URL}/paymentsuccess?reference=${razorpay_payment_id}`
    );
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

exports.paymentCheckout = async (req, res, next) => {
  try {
    // console.log("req.body", req.body);
    const userId = req.user._id;
    const userAddressIndex = req.body.userAddressIndex;
    var options = {
      amount: Number(req.body.totalPrice * 100), // amount in the smallest currency unit
      currency: "INR",
      // receipt: "order_rcptid_11",
    };
    const order = await instance.orders.create(options);
    const user = await User.findById(userId);
    user.razorPayOrderId = order.id;
    user.tempAddressId = userAddressIndex;
    await user.save();
    res.status(200).json({ message: "sucess true", order: order });
  } catch (err) {
    console.log(err);
  }
};

exports.codOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userAddressIndex = req.body.userAddressIndex;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId: userId }).populate("items.skuId"); // Populate the 'cart' field

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract cart data from the user's cart
    const items = cart.items;
    // Create an array to store order items
    const orderItems = [];
    // Process and add plant items to the order
    for (const productItem of items) {
      const sku = await Sku.findById(productItem.skuId._id.toString()).populate(
        {
          path: "productId",
          model: "Product",
        }
      );
      // console.log("sku -- ", sku)
      if (sku) {
        let item = { ...sku.productId._doc };
        item["price"] = sku.price;
        item["colour"] = productItem.quantity;
        item["size"] = sku.size;
        item["availableIn"] = sku.availableIn;
        orderItems.push({
          type: item.type,
          product: item,
          quantity: productItem.quantity,
        });
      }
    }

    const userIdObject = new mongoose.Types.ObjectId(userId.toString());

    const userAddressDoc = await UserAddress.findOne({ userId: userIdObject });

    const add = userAddressDoc.addresses[userAddressIndex];

    if (!add) {
      res.status(404).json({
        success: "false",
        message: "No address exist",
      });
    }

    const order = new Order({
      paymentType: "COD",
      orderValue: cart.totalValue,
      products: orderItems,
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          address_line1: add.address_line1,
          address_line2: add.address_line2,
          city: add.city,
          state: add.state,
          pincode: add.pincode,
        },
      },
    });

    // Save the order to the database
    await order.save();

    const newNurseryIds = [
      ...new Set(orderItems.map((item) => item.product.nurseryId.toString())),
    ];

    // console.log('nurseryIds',newNurseryIds)

    const productItems = orderItems
      .map((item) => ({
        type: item.type,
        product: item.product,
        quantity: item.quantity,
      }));

      // console.log('productItems',productItems)



    for (const id of newNurseryIds) {
      let productDetails = [];
      const orderedProduct = productItems.filter(
        (ele) => ele.product.nurseryId.toString() === id
      );
      const totalPrice = orderedProduct.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      const newValue1 = orderedProduct.map((item) => ({
        type: item.type,
        productId: item.product._id,
        quantity: item.quantity,
      }));
      productDetails = {
        orderId: order._id,
        products: newValue1,
        nurseryId: new mongoose.Types.ObjectId(id),
        totalPrice: totalPrice,
      };
      this.trackUserOrder(productDetails);
    }

    const pdf = await getUserInvoice(order);
    // console.log(pdf)
    // Clear the user's cart after creating the order
    cart.items = [];
    cart.totalValue = 0;
    await cart.save();

    return res.status(200).json({
      success: true,
      order: order,
      invoice: pdf,
    });
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

async function getUserInvoice(order) {
  try {
    const userInfo = {
      orderId: order._id.toString(),
      company: order.user.name,
      address: order.user.address.addressLine || "",
      pincode: order.user.address.pincode,
      city: order.user.address.city,
      products: order.products.map(({ product, quantity }) => ({
        quantity: `${quantity}`,
        description: `${product.name}`,
        price: `${product.price}`,
        "tax-rate": "2",
      })),
      currentDate: getCurrentDate(new Date()),
      deliveryDate: getDeliveryDate(),
      // logo: Buffer.from(logo, 'base64') // Uncomment this line if logo is available
    };

    // console.log("userInfo in payment controller == ", userInfo);
    const data = getInvoiceData(userInfo);

    const result = await easyinvoice.createInvoice(data);
    const pdfData = Buffer.from(result.pdf, "base64");

    // Save the PDF to a file (optional)
    const directoryPath = path.join(
      __dirname,
      "..",
      "build",
      "static",
      "invoice"
    );
    const filePath = path.join(directoryPath, "invoice.pdf");

    // Check if the directory exists, and if not, create it
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    fs.writeFileSync(filePath, "invoice.pdf", pdfData);
    return pdfData;
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    // res.send(result.pdf);
  } catch (err) {
    console.log(err);
    return err.message;
  }
}
