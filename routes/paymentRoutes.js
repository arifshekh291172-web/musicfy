const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Payment = require("../models/Payment");

const router = express.Router();


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// PLAN CONFIG (amount in INR, duration in days)
const PLAN_CONFIG = {
  individual: { amount: 79, days: 30, label: "Individual" },
  duo:        { amount: 129, days: 30, label: "Duo" },
  family:     { amount: 179, days: 30, label: "Family" }
};

// CREATE ORDER
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.log("Order create error:", err);
    res.json({ success: false, message: "Order creation failed" });
  }
});

// VERIFY PAYMENT + ACTIVATE / RENEW PREMIUM
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planKey, amount } = req.body;

    const signString = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signString.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }

    // Map plan using amount or planKey
    let plan = PLAN_CONFIG[planKey];
    if (!plan) {
      // fallback by amount
      if (amount == 79) plan = PLAN_CONFIG.individual;
      else if (amount == 129) plan = PLAN_CONFIG.duo;
      else if (amount == 179) plan = PLAN_CONFIG.family;
    }
    if (!plan) {
      return res.json({ success: false, message: "Invalid plan" });
    }

    // SAVE PAYMENT
    await Payment.create({
      userId: req.user._id,
      planName: "Musicfy Premium – " + plan.label,
      planKey: planKey,
      amount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "success"
    });

    // ACTIVATE / RENEW PREMIUM
    const user = await User.findById(req.user._id);
    const now = new Date();
    let base = now;

    if (user.isPremium && user.premiumExpiry && user.premiumExpiry > now) {
      base = user.premiumExpiry; // renew from previous expiry
    }

    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + plan.days);

    user.isPremium = true;
    user.premiumPlan = planKey;
    user.premiumExpiry = newExpiry;
    await user.save();

    res.json({
      success: true,
      message: "Premium activated / renewed",
      expiry: newExpiry,
      plan: planKey
    });

  } catch (err) {
    console.log("Verify error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

// LATEST PAYMENT FOR RECEIPT
router.get("/latest", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!payment) {
      return res.json({ success: false, message: "No payment record found" });
    }
    res.json({ success: true, payment });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
});

module.exports = router;
