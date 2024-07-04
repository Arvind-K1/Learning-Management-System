import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    razorpay_payment_id:{
        type: String,
        require: true
    },
    razorpay_subscription_id: {
        type:String,
        require: true
    },
    razorpay_signture: {
        type: String,
        require: true
    }
});

const Payment = mongoose.model("Payment",paymentSchema);

export default Payment