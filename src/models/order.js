const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    phonePeTransactionId: {
      type: String,
      default: "",
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    orderItems: [
      {
        restaurantName: String,
        restaurantId: String,
        description: String,
        menuItemId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        _id: String
      },
    ],

    orderAddress: {
      addressType: String,
      city: String,
      fullName: String,
      houseNo: String,
      isDefault: Boolean,
      landmark: String,
      phone: String,
      pincode: String,
      state: String,
      street: String,
      _id: String,
    },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED"
      ],
      default: "PENDING",
    },

    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "PLACED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    paymentResponse: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);