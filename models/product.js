const mongoose = require("mongoose");

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
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref:'Category',
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

    flag:{
      type:"String"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
