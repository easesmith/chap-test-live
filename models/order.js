const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderValue: {
      type: String,
      // required: true,
    },
    paymentType: {
      type: String,
      default: "Online payment",
    },
    products: [
      {
        type: {
          type: String,
          required: true,
        },
        product: {
          type: Object,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    user: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      address: {
        address_line1: {
          type: String,
          required: true,
        },
        address_line2: {
          type: String,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        pincode: {
          type: Number,
          required: true,
        },

      },
    },
    status: {
      required: true,
      type: String,
      default: "pending",
    },
    adminComment: {
      required: true,
      type: String,
      default: "Your oder has been placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
