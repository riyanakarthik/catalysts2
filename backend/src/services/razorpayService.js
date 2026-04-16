const Razorpay = require("razorpay");

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
exports.createOrder = async ({ amount, currency, receipt, notes }) => {
  return await rzp.orders.create({
    amount,
    currency,
    receipt,
    notes,
    payment_capture: 1,
  });
};