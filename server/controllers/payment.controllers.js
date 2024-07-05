import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../index.js";
import AppError from "../utils/appError.js";

const getRazorpayApiKey = async (req,res,next) => {
    try {
        res.status(200).json({
            success: true,
            message: "Razorpay API Key",
            key: process.env.RAZORPAY_API_ID
        })
    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

const buySubscription = async (req,res,next) => {
    try {
        const {id} = req.body;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User not found",404))
        }

        if(user.role === 'ADMIN'){
            return next(new AppError("Admin cannot buy subscription",403))
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1
        })

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
        
        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscription created successfully"
        })

    } catch (e) {
        return next(new AppError(e.message,500))

    }
}

const verifySubscription = async (req,res,next) => {
    try {
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User not found",500))
        }

        const {razorpay_payment_id, razorpay_signature,razorpay_subscription_id} = req.body;

        const generatedSignature = crypto
            .createHmac('sha256',process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}}`);

        if(generatedSignature !== razorpay_signature){
            return next(new AppError("Payment not verified, please try again",500))
        }

        await Payment.create({
            razorpay_payment_id,
            razorpay_signture,
            razorpay_subscription_id
        });

        user.subscription.status = 'active';
        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscription verified successfully"
        })

    
    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

const cancelSubscription = async (req,res,next) => {
    try {
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User not found",500))
        }

        if(user.role === ' ADMIN'){
            return next(new AppError("Admin cannot cancel subscription",500))
        }

        const subscriptionId = user.subscription.id;

        const subscription = await razorpay.subscription.cancel(subscriptionId);

        user.subscription.status = subscription.status;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully"
        })

    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

const getAllPayments = async (req,res,next) => {
    try {
        const {count} = req.query;

        const subscriptions = await razorpay.subscriptions.all({
            count: count || 10,
        });

        res.status(200).json({
            success: true,
            message: 'All Payment Details',
            payments: subscriptions
        })

    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    getAllPayments
}