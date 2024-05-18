const mongoose = require("mongoose");
const ShortUniqueId = require("short-unique-id");

const Nursery = require("../models/nursery");
const Product = require("../models/product");
const Sku = require("../models/sku");
const User = require("../models/user");
const Content = require("../models/content");
const Review = require("../models/review");
const UserAddress = require("../models/useraddress");
const Job = require("../models/job");
const jobApplicationModel = require("../models/jobApplication");
const Order = require("../models/order");
const Favorite = require("../models/favorite");
const Faq = require("../models/faq");
const Cart = require("../models/cart");
const Complaint = require("../models/complaint");
const Category = require("../models/category");

const catchAsync = require("../util/catchAsync");

//////////////////////////////////////////////////////
///chnaging Db fields route
exports.setType = async (req, res) => {
  const prod = await Product.find();
  for (let i in prod) {
    prod[i].type = "Plant";
    console.log(i);
    await prod[i].save();
  }
  return res.status(200).json({ message: "hogya mera tho" });
};

exports.getCategories = catchAsync(async (req, res) => {
  const type = req.query.type;
  const cats = await Category.find({ type });

  res.status(200).json({
    success: true,
    categories: cats,
  });
});

exports.setfields = async (req, res) => {
  //set fileds in schema to use this
  const prod = await Product.find();
  for (let i in prod) {
    prod[i].startPrice = prod[i].price;
    prod[i].price = undefined;
    prod[i].size = undefined;
    prod[i].availableIn = undefined;

    console.log(i);
    await prod[i].save();
  }
  return res.status(200).json({ message: "hogya mera tho" });
};

exports.setSku = async (req, res) => {
  const prod = await Product.find();
  for (let i in prod) {
    var s = new Sku();
    console.log(prod[i].price);
    s.productId = prod[i]._id;
    s.price = prod[i].price;
    s.size = prod[i].size;
    s.availableIn = prod[i].availableIn;
    await s.save();
  }
  return res.status(200).json({ message: "hogya mera tho" });
};

exports.getNewArivalPlants = catchAsync(async (req, res, next) => {
  const plants = await Product.find({ type: "Plant", flag: "new-arrival" })
    .sort({ created_at: -1 })
    .limit(8);

  res.status(200).json({ plants: plants });
});

exports.getBestSellerPlants = catchAsync(async (req, res, next) => {
  const plants = await Product.find({ type: "Plant", flag: "best-seller" })
    .sort({ created_at: -1 })
    .limit(8);

  res.status(200).json({ plants: plants });
});
exports.getDealOfTheDay = catchAsync(async (req, res, next) => {
  const plant = await Product.findOne({
    type: "Plant",
    flag: "deal-of-the-day",
  });

  res.status(200).json({ plant: plant });
});

///////////////////////////////////////////////////////////////////////

exports.getCartItemsLength = catchAsync(async (req, res, next) => {
  const userId = req.body.userId;
  const cartId = req.body.cartId;

  if (userId) {
    const user = await User.findById(userId).populate("cartId");
    console.log("user cart", user.cartId.items.plants.length);
    const length = user.cartId.items.plants.length;
    res.status(200).json({
      status: "success",
      length: length,
    });
  }

  if (cartId) {
    const cart = await Cart.findById(cartId);
    const length = cart.items.plants.length;
    console.log("guest cart", cart);
    console.log("vvvvvvvvvvvvvvvv", length);
    res.status(200).json({
      status: "success",
      length: length,
    });
  }
});
//////////////
//Sku Controller
exports.getSkus = catchAsync(async (req, res, next) => {
  const prodId = req.params.productId;
  var skus = await Sku.find({ productId: prodId }).populate({
    path: "productId",
  });
  return res.status(200).json({ skus: skus, message: "success" });
});

/// Cart Controller

exports.getCart = catchAsync(async (req, res, next) => {
  const user = req.user;
  let cart;
  if (user) {
    cart = await Cart.findById(user.cartId).populate({
      path: "items.skuId",
      model: "Sku",
      populate: {
        path: "productId",
        model: "Product",
      },
    });

    let tempCart = cart.items.map((item) => {
      let quantity = item.quantity;
      const { price, size, availableIn, _id } = item.skuId;
      const { name, category, imageUrl } = item.skuId.productId;
      return {
        skuId: _id,
        name,
        category,
        imageUrl,
        price,
        size,
        availableIn,
        quantity,
      };
    });

    let totalValue = cart.totalValue;

    cart = { items: [...tempCart], totalValue };
  } else if (req.cookies["guestCart"]) {
    cart = JSON.parse(req.cookies["guestCart"]);
    let cartItems = [];
    // console.log("guest cart", cart);

    for (index in cart.items) {
      const sku = await Sku.findById(cart.items[index].skuId).populate({
        path: "productId",
        model: "Product",
      });
      // console.log(sku)
      let quantity = cart.items[index].quantity;
      const { price, size, availableIn, _id } = sku;
      const { name, category, imageUrl } = sku.productId;
      let item = {
        skuId: _id,
        name,
        category,
        imageUrl,
        price,
        size,
        availableIn,
        quantity,
      };
      // console.log('before adding',item)

      cartItems.push(item);
    }
    cart.items = cartItems;
  } else {
    res.status(200).json({
      success: "false",
      message: "cart is empty",
      cart: [],
    });
  }

  if (cart) {
    res.status(200).json({
      success: true,
      message: "cart items",
      cart: cart,
    });
  }
});

exports.postAddProductToCart = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { itemId } = req.body; // item id
  var cart;

  const sku = await Sku.findById(itemId).populate({
    path: "productId",
    model: "Product",
  });
  console.log(sku);
  if (!sku) {
    return res.status(404).json({ message: "Sku does not exist" });
  } else if (user) {
    cart = await Cart.findById(user.cartId);
    await cart.addProduct(sku);
  } else if (req.cookies["guestCart"]) {
    console.log("guest cart");
    cart = JSON.parse(req.cookies["guestCart"]);
    const existingItemIndex = cart.items.findIndex((product) => {
      return product.skuId.toString() === itemId.toString();
    });

    console.log("index", existingItemIndex);
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity++;
      cart.totalValue += sku.price;
    } else {
      cart.items.push({ skuId: itemId, quantity: 1 });
      cart.totalValue += sku.price;
    }
    res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
  } else {
    console.log("newly created guest cart");
    const { price, size, availableIn, _id } = sku;
    const { name, category, imageUrl } = sku.productId;
    cart = {
      items: [
        {
          skuId: _id,
          name,
          category,
          imageUrl,
          price,
          size,
          availableIn,
          quantity: 1,
        },
      ],
      // items: [{ skuId: itemId, quantity: 1 }],
      totalValue: sku.price,
    };
    // console.log(prod);
    console.log(cart);
    res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
  }
  if (cart) {
    return res.status(200).json({
      cart: cart,
      cartlength: cart.items.length,
      success: true,
      message: "item added from cart",
    });
  }
});

exports.postDeleteProductFromCart = catchAsync(async (req, res, next) => {
  // console.log("cookie",req.cookies["guestCart"]);
  const { itemId } = req.body; // item id
  const user = req.user;
  const sku = await Sku.findById(itemId);
  var cart;
  if (!sku) {
    return res.status(404).json({ message: "Sku does not exist" });
  } else if (user) {
    cart = await Cart.findById(user.cartId);
    await cart.deleteProduct(sku);
    if (cart.items.length === 0) {
      console.log("empty");
      res.clearCookie("guestCart");
      res.json({ success: true, message: "cart is empthy" });
    }
  } else if (req.cookies["guestCart"]) {
    cart = JSON.parse(req.cookies["guestCart"]);
    const existingItemIndex = cart.items.findIndex((product) => {
      return product.skuId.toString() === itemId.toString();
    });

    console.log("index", existingItemIndex);
    if (existingItemIndex < 0) {
      return res
        .status(404)
        .json({ message: "Product does not exist in the cart" });
    } else if (cart.items[existingItemIndex].quantity > 1) {
      cart.items[existingItemIndex].quantity--;
    } else {
      var newCart = cart.items.filter((product) => {
        console.log(product.skuId.toString() !== itemId.toString());
        return product.skuId.toString() !== itemId.toString();
      });
      cart.items = newCart;
      if (cart.items.length === 0) {
        console.log("empty");
        res.clearCookie("guestCart");
        res.json({ success: true, message: "cart is empthy" });
      }
    }
    if (cart.items.length > 0) {
      cart.totalValue -= sku.price;
      res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
    }
  } else {
    res.status(200).json({ success: true, message: "cart is empthy" });
  }
  if (cart && cart.items.length > 0) {
    console.log(cart.items.length);
    return res.status(200).json({
      cart: cart,
      cartlength: cart.items.length,
      success: true,
      message: "item removed from cart",
    });
  }
});

// Order Controller

exports.getAllOrders = catchAsync(async (req, res, next) => {
  var order = await Order.find({});
  return res.status(200).json({ order: order });
});

exports.getOrderDetails = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  var order = await Order.findById(orderId);
  return res.status(200).json({ order: order });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is order id
  var order = await Order.findOne({ _id: id });
  order.status = "cancelled";
  await order.save();
  return res
    .status(200)
    .json({ success: true, message: "Order cancelled successful" });
});

exports.getOrders = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const page = req.query.page || 1;
  const limit = req.query.limit || 12;
  var orders = await Order.find({ "user.userId": userId })
    .skip((page - 1) * limit)
    .limit(limit);
  const count = await Order.find({ "user.userId": userId }).length();
  return res.status(200).json({
    success: true,
    message: "Your order list",
    data: orders,
    count: count,
  });
});

exports.searchOrders = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const userId = req.user.id;

  const orders = await Order.find({
    "products.product.name": { $regex: new RegExp(query, "i") },
    "user.userId": userId,
  });
  return res.status(200).json({
    success: true,
    message: "Your order list",
    length: orders.length,
    data: orders,
  });
});

////////////////////////////////////////////// product controller
exports.getProductDetails = catchAsync(async (req, res, next) => {
  const prodId = req.params.productId;
  var prod = await Product.findById(prodId);
  return res.status(200).json({ product: prod });
});

exports.getNearestNurseryProduct = catchAsync(async (req, res) => {
  const { longitude, latitude } = req.body;
  const pageSize = req.query.pageSize || 10;
  const page = req.query.page || 1;

  const nurseries = await Nursery.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: "dist.calculated",
        key: "location",
        maxDistance: 25000,
        spherical: true,
      },
    },
  ]);

  const nurseriesIds = nurseries.map((nursery) => nursery._id);

  const products = await Product.find({ nurseryId: { $in: nurseriesIds } })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  if (products.length === 0) {
    return res.status(200).json({
      message: "No nearest nursery's product found",
      length: products.length,
    });
  }

  res.status(200).json({
    message: "Product has been fetched",
    products: products,
    length: products.length,
  });
});

exports.filterSkuByPrice = catchAsync(async (req, res) => {
  const maxPrice = req.query.maxPrice;
  const minPrice = req.query.minPrice || 0;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;

  const products = await Sku.find({
    $and: [{ price: { $lte: maxPrice } }, { price: { $gte: minPrice } }],
  })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  if (products.length < 0) {
    return res.status(400).json({
      message: "Product not found",
    });
  }

  res.status(200).json({
    products: products,
    size: products.length,
  });
});

exports.filterSkuBySize = catchAsync(async (req, res) => {
  const maxSize = req.query.maxSize;
  const minSize = req.query.minSize || 0;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;

  const result = await Sku.find({
    $and: [{ size: { $lte: maxSize } }, { size: { $gte: minSize } }],
  })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  res.status(200).json({
    products: result,
    size: result.length,
  });
});

exports.getContent = catchAsync(async (req, res, next) => {
  const title = req.query.title;
  const content = await Content.findOne({ title: title });
  if (!content) {
    return res.status(404).json({
      message: `No content found for the title ${title}`,
    });
  }
  res.status(200).json({
    content: content,
  });
});

exports.getAllFaqs = catchAsync(async (req, res, next) => {
  const faqs = await Faq.find();

  res.status(200).json({
    success: true,
    faqs,
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobs = await Job.find();

  res.status(200).json({
    success: true,
    jobs,
  });
});

exports.getBanners = catchAsync(async (req, res, next) => {
  // console.log(req.query)
  const { section, type } = req.query;

  if (!section || !type) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const banners = await Content.find({ section, type });

  res.status(200).json({
    success: true,
    banners,
  });
});

exports.findSkuBySize = catchAsync(async (req, res) => {
  const maxSize = req.query.maxSize;
  const minSize = req.query.minSize || 0;

  const result = await Sku.find({
    $and: [{ size: { $lte: maxSize } }, { size: { $gte: minSize } }],
  }).populate("productId");
  // .skip((pageNumber - 1) * pageSize)
  // .limit(pageSize);

  res.status(200).json({
    success: true,
    message: "Product list",
    data: result,
  });
});

exports.getAllProduct = catchAsync(async (req, res, next) => {
  const { name, startPrice, categoryId, type, material, size } = req.query;

  const filter = {};
  if (name) filter.name = new RegExp(name, "i");
  if (startPrice) {
    const [minPrice, maxPrice] = startPrice.split("-").map(Number);
    filter.startPrice = { $gte: minPrice, $lte: maxPrice };
  }
  if (categoryId) filter.categoryId = categoryId;
  if (type) filter.type = type;

  const products = await Product.find(filter);

  let finalProducts = products;
  if (material) {
    const skus = await Sku.find({ material: material });
    const prodIds = skus.map((sku) => sku.productId.toString());
    const uniqueProdIds = [...new Set(prodIds)];

    let filteredCommonProducts = [];
    for (let i = 0; i < finalProducts.length; i++) {
      for (let j = 0; j < uniqueProdIds.length; j++) {
        if (finalProducts[i]._id.toString() === uniqueProdIds[j]) {
          filteredCommonProducts.push(finalProducts[i]);
        }
      }
    }
    finalProducts = filteredCommonProducts;
  }

  if (size) {
    console.log(size);
    const [min, max] = size.split("-").map(Number);
    const skus = await Sku.find({ size: { $gte: min, $lte: max } });

    const prodIds = skus.map((sku) => sku.productId.toString());
    const uniqueProdIds = [...new Set(prodIds)];

    let filteredCommonProducts = [];
    for (let i = 0; i < finalProducts.length; i++) {
      for (let j = 0; j < uniqueProdIds.length; j++) {
        if (finalProducts[i]._id.toString() === uniqueProdIds[j]) {
          filteredCommonProducts.push(finalProducts[i]);
        }
      }
    }
    finalProducts = filteredCommonProducts;
  }

  res.status(200).json({
    success: true,
    products: finalProducts,
    length: products.length,
  });
});

exports.editUserDetails = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { name, phone, gender } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, phone, gender },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      message: "User does not exist",
    });
  }

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

// * search controllers
exports.searchByProductName = catchAsync(async (req, res) => {
  let { name, page, limit } = req.query;
  if (!limit || !page) {
    limit = 10;
    page = 1;
  }
  // Your specific search by name logic
  const results = await Product.find({
    name: { $regex: new RegExp(name, "i") },
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.status(200).json({ results });
});

exports.handleCommonSearch = catchAsync(async (req, res) => {
  const name = req.query.name;
  const category = req.query.category;

  const allProducts = await Product.find({
    $and: [
      { name: { $regex: new RegExp(name, "i") } },
      { category: { $regex: new RegExp(category, "i") } },
    ],
  });

  res.status(200).json({
    success: true,
    products: allProducts,
    length: allProducts.length,
  });
});

exports.searchProductByNurseryId = catchAsync(async (req, res) => {
  const nurseryId = new mongoose.Types.ObjectId(req.query.nurseryId);
  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const product = await Product.aggregate([
    { $match: { nurseryId: nurseryId } },
    { $skip: skip },
    { $limit: pageSize },
  ]);

  if (product.length < 0) {
    return res.status(400).json({
      message: "No product found",
    });
  }
  res.status(200).json({
    products: product,
  });
});

exports.searchProductByPriceRange = catchAsync(async (req, res) => {
  const maxPrice = req.query.maxPrice || 50000;
  const minPrice = req.query.minPrice || 0;
  const category = req.query.category;

  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 20;
  const allProduct = await Product.find({
    $and: [
      { startPrice: { $lte: maxPrice } },
      { startPrice: { $gte: minPrice } },
      { category: { $eq: category } },
    ],
  }).count();
  var num = allProduct / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const products = await Product.find({
    $and: [
      { startPrice: { $lte: maxPrice } },
      { startPrice: { $gte: minPrice } },
      { category: { $eq: category } },
    ],
  })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  res
    .status(200)
    .json({ success: true, productList: products, totalPage: totalPage });
});

// * review

exports.addreview = catchAsync(async (req, res, next) => {
  const { title, content, rating, type, productId } = req.body;

  const userId = req.user._id;

  if (!productId || !title || !content || !rating || !type) {
    return res.status(400).json({ message: "All fields are requried" });
  }

  const review = await Review.create({
    type: type,
    title: title,
    content: content,
    // image: imgURL,
    rating: rating,
    userId: userId,
    productId: productId,
  });

  if (!review) {
    return res.status(400).json({ msg: "Couldn't added the review" });
  }

  res.status(200).json({
    msg: "Review is added",
    review: review,
  });
});

exports.updateReview = catchAsync(async (req, res) => {
  const reviewId = req.params.id;
  const { type, title, content, rating } = req.body;

  const imageURL = req.file.path;
  if (!imageURL) {
    return res.status(400).json({ message: "Image is not provided" });
  }

  if (!reviewId) {
    return res.status(400).json({ msg: "Please provide review Id" });
  }

  const newUpdate = {
    type: type,
    title: title,
    content: content,
    rating: rating,
    image: imageURL,
  };
  const review = await Review.findOneAndUpdate(reviewId, newUpdate);
  if (!review) {
    return res.status(400).json({ msg: "Couldn't update the review" });
  }
  res.status(200).json({
    msg: "Review is updated",
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const reviews = await Review.find({ productId: productId }).populate({
    path: "userId",
    Model: "User",
  });

  if (!reviews) {
    return res.status(400).json({ msg: "Reviews not found" });
  }

  res.status(200).json({
    message: "All reviews fetched",
    reviews: reviews,
  });
});

// * useraddress

exports.addUserAddress = catchAsync(async (req, res) => {
  const { address_line1, address_line2, state, city, pincode } = req.body;

  // const userId = req.query.userId;
  const userId = req.user.id;

  const address = {
    address_line1: address_line1,
    address_line2: address_line2,
    state: state,
    city: city,
    pincode: pincode,
  };

  const useraddress = await UserAddress.findOneAndUpdate(
    { userId: userId },
    { $push: { addresses: address } },
    { upsert: true, new: true }
  );

  if (!useraddress) {
    return res.status(400).json({
      message: "Could not create user address please try again!",
    });
  }

  res.status(200).json({
    message: "User address added successfully",
  });
});

exports.updateUserAddress = catchAsync(async (req, res) => {
  const addressId = req.params.id;
  // const userId = req.query.userId;
  const userId = req.user.id;
  const userAddress = await UserAddress.aggregate([
    {
      $unwind: { path: "$addresses" },
    },
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        "addresses._id": new mongoose.Types.ObjectId(addressId),
      },
    },
  ]);
  if (userAddress.length == 0) {
    return res.status(404).json({
      message: "User address not found",
    });
  }

  const {
    address_line1,
    address_line2,
    country,
    state,
    city,
    pincode,
    mobile,
    defaultAddress,
  } = req.body;

  const update = await UserAddress.findOneAndUpdate(
    {
      userId: userId,
      "addresses._id": addressId, // Use the _id of the address you want to update
    },
    {
      $set: {
        "addresses.$.address_line1": address_line1,
        "addresses.$.address_line2": address_line2,
        "addresses.$.country": country,
        "addresses.$.state": state,
        "addresses.$.city": city,
        "addresses.$.pincode": pincode,
        "addresses.$.mobile": mobile,
        "addresses.$.defaultAddress": defaultAddress,
      },
    },
    { new: true }
  );

  if (!update) {
    return res.status(400).json({
      message: "Could not update user address",
    });
  }

  res.status(200).json({
    message: "updated successfully",
  });
});

exports.getAllAddresses = catchAsync(async (req, res) => {
  // const userId = req.query.userId;
  const userId = req.user.id;
  const addresses = await UserAddress.find({ userId: userId });

  if (!addresses) {
    return res.status(400).json({
      message: "No Address found",
    });
  }

  res.status(200).json({
    addresses: addresses,
  });
});

exports.deleteAddress = catchAsync(async (req, res) => {
  const addressId = req.params.id;
  // const userId = req.query.userId;
  const userId = req.user.id;
  const userAddress = await UserAddress.aggregate([
    {
      $unwind: { path: "$addresses" },
    },
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        "addresses._id": new mongoose.Types.ObjectId(addressId),
      },
    },
  ]);
  if (userAddress.length == 0) {
    return res.status(404).json({
      message: "User address not found",
    });
  }

  const deleteUserAddress = await UserAddress.updateOne(
    {
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $pull: { addresses: { _id: new mongoose.Types.ObjectId(addressId) } } }
  );

  if (!deleteUserAddress) {
    return res.status(400).json({
      message: "Failed to delete the address",
    });
  }

  res.status(200).json({
    message: "Address is deleted",
  });
});

// * job
exports.createJob = catchAsync(async (req, res) => {
  const {
    name,
    phone,
    jobId,
    email,
    age,
    experience,
    address,
    pincode,
    aadharNo,
    panNo,
    ReferencePerson,
    ModeofTransport,
    salary,
  } = req.body;
  if (
    !name ||
    !phone ||
    !jobId ||
    !email ||
    !age ||
    !experience ||
    !address ||
    !pincode ||
    !aadharNo ||
    !panNo ||
    !ModeofTransport ||
    !salary
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All the fields are required" });
  }
  await jobApplicationModel.create({
    name: name,
    phone: phone,
    jobId: jobId,
    email: email,
    age: age,
    experience: experience,
    address: address,
    pincode: pincode,
    aadharNo: aadharNo,
    panNo: panNo,
    ModeofTransport: ModeofTransport,
    salary: salary,
    ReferencePerson,
  });
  res.status(201).json({ success: true, message: "Job created successful" });
});

// * complaint

exports.addComplaint = catchAsync(async (req, res) => {
  console.log("hello");
  const { issue, issueType, assignee, description, orderId, productId } =
    req.body;
  console.log(req.body);

  const img = req.file;
  console.log(req.file);

  if (!img) {
    return res.status(400).json({ msg: "No image provided" });
  }
  const uid = new ShortUniqueId({ length: 10 });
  const ticketNumber = uid.rnd();

  const image = img.path;
  console.log(image, "this is test log image");

  const complaint = await Complaint.create({
    issue: issue,
    issueType: issueType,
    ticketNumber: ticketNumber,
    assignee: assignee,
    description: description,
    image: image,
    orderId: new mongoose.Types.ObjectId(orderId),
    productId: new mongoose.Types.ObjectId(productId),
    userId: req.user
      ? req.user.id
      : new mongoose.Types.ObjectId(req.query.userId),
  });

  res.status(200).json({
    message: "Complaint is added",
    complaint: complaint,
  });
});

exports.viewAllComplaints = catchAsync(async (req, res) => {
  const complaints = await Complaint.find({});

  if (!complaints) {
    return res.status(400).json({
      message: "No complaint found",
    });
  }

  res.status(200).json({
    complaints: complaints,
  });
});

exports.viewAllOpenedComplaints = catchAsync(async (req, res) => {
  const complaints = await Complaint.find({ status: "opened" });

  if (!complaints) {
    return res.status(400).json({
      message: "No complaint found",
    });
  }

  res.status(200).json({
    complaints: complaints,
  });
});

exports.viewAllClosedComplaints = catchAsync(async (req, res) => {
  const complaints = await Complaint.find({ status: "closed" });

  if (!complaints) {
    return res.status(400).json({
      message: "No complaint found",
    });
  }

  res.status(200).json({
    complaints: complaints,
  });
});

exports.viewAllUserComplaints = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : req.params.userId;
  const complaints = await Complaint.find({ userId: userId });

  if (!complaints) {
    return res.status(400).json({
      message: "No complaint found",
    });
  }

  res.status(200).json({
    complaints: complaints,
    length: complaints.length,
  });
});

exports.updateComplaintById = catchAsync(async (req, res) => {
  const complaintId = req.params.id;

  const {
    issue,
    issueType,
    description,
    orderId,
    productId,
    reply,
    repliedBy,
    status,
  } = req.body;
  console.log(req.body);

  const replyId = req.query.replyId;
  console.log("replyId = ", replyId);
  let image;

  if (req.file) {
    image = req.file.path;
  }

  const userId = req.user ? req.user.id : req.query.userId;
  // console.log(userId);
  //does user exists
  const user = await User.findById(userId);
  // console.log(user);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  const exists = await Complaint.findOne({
    _id: complaintId,
    userId: userId,
  });
  // console.log(exists);
  if (!exists) {
    return res.status(404).json({
      message: "Complaint could not be found",
    });
  }
  // console.log('exists');
  if (exists.status === "closed") {
    return res.status(404).json({
      message: "Complaint is closed please regenerate it!",
    });
  }

  const updateFields = {
    issue: issue,
    issueType: issueType,
    description: description,
    orderId: orderId,
    productId: productId,
    image: image,
    status: status,
  };

  // console.log("object")
  if (replyId && reply && repliedBy) {
    // Update a specific reply by its ID
    const replyIndex = exists.replies.findIndex(
      (r) => r._id.toString() === replyId
    );
    if (replyIndex !== -1) {
      exists.replies[replyIndex].reply = reply;
      exists.replies[replyIndex].repliedBy = repliedBy;
      await exists.save();
    }
  } else {
    // Add a new reply
    // console.log("two");

    exists.replies.push({
      reply: reply,
      repliedBy: repliedBy,
    });
    await exists.save();
  }

  // await exists.save();

  const complaint = await Complaint.findOneAndUpdate(
    { _id: complaintId },
    updateFields,
    { new: true }
  );
  // console.log("complaint == ", complaint);

  if (!complaint) {
    return res.status(400).json({
      message: "Complaint could not be updated",
    });
  }

  res.status(200).json({
    message: "Complaint updated succesfully",
    complaint: complaint,
  });
});

exports.updateComplaintStatus = catchAsync(async (req, res) => {
  const complaintId = req.params.id;
  const complaint = await Complaint.findOne({ _id: complaintId });
  console.log("com = ", complaint);
  if (!complaint) {
    return res.status(400).json({
      message: "Complaint couldn't be updated",
    });
  }
  const { reply, repliedBy, status, assignee } = req.body;

  if (!reply && !repliedBy) {
    return res.status(400).json({
      message: "Reply message or repliedBy is required",
    });
  }

  const replyId = req.query.replyId;

  if (replyId) {
    const replyIndex = complaint.replies.findIndex(
      (c) => c._id.toString() === replyId
    );

    if (replyIndex != -1) {
      complaint.replies[replyIndex].reply = reply;
      complaint.replies[replyIndex].repliedBy = repliedBy;
    }
    await complaint.save();
  } else if (reply && repliedBy) {
    complaint.replies.push({
      reply: reply,
      repliedBy: repliedBy,
    });
    await complaint.save();
  }

  const update = {
    status: status,
    assignee: assignee,
  };

  await Complaint.findOneAndUpdate({ _id: complaintId }, update, {
    new: true,
  });

  res.status(200).json({
    message: "Updated successfully",
    complaint: complaint,
  });
});

exports.deleteComplaint = catchAsync(async (req, res) => {
  const complaintId = req.params.id;

  if (!complaintId) {
    return res.status(400).json({
      message: "No complaint Id is provided",
    });
  }

  const complaint = await Complaint.findOne({ _id: complaintId });

  if (!complaint) {
    return res.status(400).json({
      message: "No complaint could be found",
    });
  }

  await Complaint.findOneAndRemove({ _id: complaintId });
  res.status(200).json({
    message: "Complaint is deleted",
  });
});

// * favorite
exports.addToFavorite = catchAsync(async (req, res) => {
  const productId = req.body.productId;
  // const userId = req.query.userId;
  const userId = req.user.id;
  if (!productId || !userId) {
    return res.status(400).json({
      message: "ProductId or userId should not be empty",
    });
  }

  const product = await Product.findOne({ _id: productId });
  const user = await User.findOne({ _id: userId });
  console.log("product == ", product);
  console.log("user == ", user);
  if (!product || !user) {
    return res.status(400).json({
      message: "Product or User could not be found",
    });
  }

  const isProductInFavorites = await Favorite.findOne({
    products: productId,
    userId: userId,
  });

  if (isProductInFavorites) {
    return res.status(400).json({
      message: "Product is already in favorites",
    });
  }

  const favorite = await Favorite.findOneAndUpdate(
    { userId: userId },
    { $push: { products: productId } },
    { upsert: true, new: true }
  );

  res.status(200).json({
    message: "Product is marked favorite",
    favorite: favorite,
  });
});

exports.getAllFavorites = catchAsync(async (req, res) => {
  //uncomment below to test without middleware
  // const userId = req.query.userId;
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({
      message: "UserId is empty",
    });
  }
  const favorites = await Favorite.findOne({ userId: userId }).populate(
    "products"
  );

  res.status(200).json({
    favorites: favorites,
  });
});

exports.searchFavorites = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const userId = "660f99d69c1b1caf3d93e958";

  const prods = await Favorite.searchByName(userId, query);

  // const orders = await Order.find({
  //   userId: userId,
  // });

  // const prodIds = orders.map
  return res.status(200).json({
    success: true,
    message: "Your order list",
    length: prods.length,
    data: prods,
  });
});

exports.removeFavoriteProduct = catchAsync(async (req, res) => {
  const productId = req.params.productId;
  // const userId = req.query.userId;
  const userId = req.user.id;
  const product = await Product.findById(productId);
  const user = await User.findById(userId);

  if (!product || !user) {
    return res.status(400).json({
      message: "Product or User could not be found",
    });
  }
  const favorite = await Favorite.findOneAndUpdate(
    { userId: userId },
    { $pull: { products: productId } },
    { new: true }
  );
  if (!favorite) {
    return res.status(400).json({
      message: "Could not remove favorite",
    });
  }
  res.status(200).json({
    message: `${productId} removed from favorites`,
  });
});
