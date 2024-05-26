const mongoose = require("mongoose");
const Review = require("./review");

const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      default: "Plant",
    },
    name: {
      type: String,
      required: true,
    },
    startPrice: {
      type: Number,
      // required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: [String], // Array of strings
      required: true,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "notApproved",
    },
    nurseryId: {
      type: Schema.Types.ObjectId,
      ref: "Nursery",
      required: true,
    },
    flag: {
      type: String
    },
    avgRating: {
      type: Number,
      default: 0
    },
    noOfReviews:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

ProductSchema.methods.calculateAvgRating = async function() {
  try {
    const reviews = await Review.find({ productId: this._id });
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      this.avgRating = 0;
      await this.save();
      return;
    }

    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const calculatedAvgReview = Math.floor(sumRatings / totalReviews);

    this.noOfReviews = totalReviews;
    this.avgRating = calculatedAvgReview;
    await this.save();
  } catch (error) {
    throw new Error('Error calculating average rating: ' + error.message);
  }
};

module.exports = mongoose.model("Product", ProductSchema);
