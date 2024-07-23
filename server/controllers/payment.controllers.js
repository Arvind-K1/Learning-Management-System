import crypto from 'crypto';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';

import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";

import {razorpay} from "../index.js";
import {AppError} from "../utils/appError.js";

const getRazorpayApiKey = asyncHandler( async (req,res,next) => {
    
        res.status(200).json({
            success: true,
            message: "Razorpay API Key",
            key: process.env.RAZORPAY_API_ID
        });
    
});

const buySubscription = asyncHandler( async (req,res,next) => {
    
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
            customer_notify: 1,
            total_count: 12,
        })

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
        
        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscription created successfully",
            subscription_id: subscription.id,
        });

     
});

const verifySubscription = asyncHandler( async (req,res,next) => {
    
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User not found",500))
        }

        const {razorpay_payment_id, razorpay_signature,razorpay_subscription_id} = req.body;

        const subscriptionId = user.subscription.id;

        const generatedSignature = crypto
            .createHmac('sha256',process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${subscriptionId}}`)
            .digest('hex');

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

    
    
});

const cancelSubscription = asyncHandler( async (req,res,next) => {
    
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User not found",500))
        }

        if(user.role === ' ADMIN'){
            return next(new AppError("Admin cannot cancel subscription",500))
        }

        const subscriptionId = user.subscription.id;

        try {
            const subscription = await razorpay.subscription.cancel(subscriptionId);

            user.subscription.status = subscription.status;

            await user.save();

        } catch (error) {
            return next(new AppError(error.error.description, error.statusCode));
        }

        const payment = await Payment.findOne({
            razorpay_subscription_id: subscriptionId
        });

        const timeSinceSubscribed = Date.now() - payment.createdAt;

        const refundPeriod = 14*24*60*60*1000;

        if( refundPeriod <= timeSinceSubscribed){
            return next(new AppError("Refund period is over, so there will not be any refunds provided.",400));
        }

        //if refund period is valid
        await razorpay.payments.refund(payment.razorpay_payment_id,{
            speed: 'optimum',
        });

        user.subscription.id = undefined;
        user.subscription.status = undefined;

        await user.save();
        await payment.remove();

        res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully"
        })

    
});

const getAllPayments = asyncHandler( async (req,res,next) => {
    
        const {count, skip } = req.query;

        const allPayments = await razorpay.subscriptions.all({
            count: count ? count: 10,
            skip: skip ? skip: 0,
        });

        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          
          const finalMonths = {
            January: 0,
            February: 0,
            March: 0,
            April: 0,
            May: 0,
            June: 0,
            July: 0,
            August: 0,
            September: 0,
            October: 0,
            November: 0,
            December: 0,
          };

        const monthlyWisePayments = allPayments.items.map((payment) => {
            const monthsInNumbers = new Date(payment.start_at*1000);

            return monthNames[monthsInNumbers.getMonth()];
        });

        monthlyWisePayments.map((month) => {
            Object.keys(finalMonths).forEach((objMonth) => {
                if(month === objMonth) {
                    finalMonths[month] += 1;
                }
            });
        });

        const monthlySalesRecord = [];

        Object.keys(finalMonths).forEach((monthName) => {
            monthlySalesRecord.push(finalMonths[monthName]);
        });

        res.status(200).json({
            success: true,
            message: 'All Payment Details',
            allPayments,
            finalMonths,
            monthlySalesRecord,
        });

    
});

export {
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    getAllPayments
}