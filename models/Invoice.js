const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paymentId: String,
  orderId: String,
  planName: String,
  amount: Number,
  gst: Number,
  totalAmount: Number,
  pdfUrl: String,            // stored PDF path / url
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Invoice", invoiceSchema);
