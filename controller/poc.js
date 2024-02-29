const express = require('express');
const app = express();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
router.post("/order",async(req, res) => {
  console.log("enter ");
  const razorpay = new Razorpay({
      key_id:"rzp_test_iupJrCXb3OkViV",

      key_secret:"ENTq0OZLrGiOApdzk70wzd1Y"

  });
  const options = req.body;
  const order = await razorpay.orders.create(options);
  if(!order){
      return res.status(500).send("error");
  }
  res.json(order);

});

router.post("/order/validate", async (req, res) => {
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256","ENTq0OZLrGiOApdzk70wzd1Y");
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});