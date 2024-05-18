const express = require("express");
const { userAuth,userAuthForCart } = require("../middleware/auth");
const upload= require('../middleware/imgUpload')

const router = express.Router();

const shopController = require("../controllers/shop");
const authContrroller = require("../controllers/auth");


router.get("/get-newarival-plants", shopController.getNewArivalPlants);
router.get("/get-bestseller-plants", shopController.getBestSellerPlants);
router.get("/get-dealoftheday-plant", shopController.getDealOfTheDay);

router.get("/get-product/:productId", shopController.getProductDetails);

router.get("/get-products",shopController.getAllProduct)
router.get("/get-categories",shopController.getCategories)


////
//Sku routes
router.get("/get-skus/:productId", shopController.getSkus);
router.get("/skus-by-size", shopController.findSkuBySize);

// Cart routes
router.get("/cart-details",userAuthForCart ,shopController.getCart);
router.post("/add-item-to-cart", userAuthForCart, shopController.postAddProductToCart);
router.post(
  "/remove-cart-item",
  userAuthForCart,
  shopController.postDeleteProductFromCart
);


//Order routes
// *
router.get("/search-orders",userAuth,shopController.searchOrders);

router.get("/get-orders/:userId",userAuth,shopController.getOrders);
router.get("/get-order-details/:orderId", shopController.getOrderDetails);
router.get("/get-all-orders", shopController.getAllOrders);
router.get("/cancel-order/:id",shopController.cancelOrder)   // passing order id

router.get("/get-user", userAuth, authContrroller.getUser);
router.patch("/edit-user-details", userAuth, shopController.editUserDetails);


// router.get("/get-set", shopController.setfields);


router.get("/search-product", shopController.searchByProductName);
router.get("/common-search",shopController.handleCommonSearch);

router.get('/search-by-nursery',shopController.searchProductByNurseryId)
router.get('/search-by-priceRange', shopController.searchProductByPriceRange);

router.get('/get-nearest-nursery/products', shopController.getNearestNurseryProduct)

// sku routes

router.get('/filter-sku-by-price',userAuth,shopController.filterSkuByPrice);
router.get('/filter-sku-by-size',userAuth,shopController.filterSkuBySize);


// website content

router.get("/get-content/by-title",shopController.getContent);
router.get("/get-all-faqs",shopController.getAllFaqs);
router.get("/get-all-jobs",shopController.getAllJobs);
router.get("/get-banners",shopController.getBanners);


// reviews /reviews/add-review
router.post("/add-review", userAuth,shopController.addreview);
router.put("/update-review/:id", userAuth, shopController.updateReview);
router.get("/get-reviews/:id", shopController.getAllReviews);


// user address
router.post("/add-userAddress", userAuth,shopController.addUserAddress);
router.patch("/update/:id", userAuth ,shopController.updateUserAddress);
router.get("/getAll-addresses", userAuth,   shopController.getAllAddresses);
router.delete("/delete-address/:id", userAuth,  shopController.deleteAddress);


// job
router.post("/create-job",shopController.createJob);


// complaints
router.post("/add-complaint",userAuth,upload.single('image'),shopController.addComplaint);

router.get(
  "/view-all-complaints",
  
  shopController.viewAllComplaints
);

router.get("/view-all-opened-complaints", shopController.viewAllOpenedComplaints);

router.get("/view-all-closed-complaints", shopController.viewAllClosedComplaints);

router.get(
  "/view-user-complaint",
  userAuth,
  shopController.viewAllUserComplaints
);
//user can update the complaint details
router.patch("/update-complaint/:id", shopController.updateComplaintById);
// only used to update the status , assignee and also provide reply and repliedBy (nursery or admin can utilize)
router.patch("/update-complaint-status/:id", shopController.updateComplaintStatus);
// delete
router.delete("/delete-complaint/:id", shopController.deleteComplaint);


//favourite
router.post("/add-favorite/product", userAuth ,shopController.addToFavorite);

router.get("/getAll-favorites", userAuth,  shopController.getAllFavorites);
router.get("/search-favorites",shopController.searchFavorites);
router.delete("/remove-favorite/:productId", userAuth, shopController.removeFavoriteProduct);

module.exports = router;
