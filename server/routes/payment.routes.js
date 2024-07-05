import express from 'express';

import { buySubscription, cancelSubscription, getAllPayments, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controllers';
import { authorizedRole, isLoggedIn } from '../middlewares/auth.middleware';

const router = express.Router();

router
    .route('/razorpay-key')
    .get(
        isLoggedIn,
        getRazorpayApiKey
    );

router
    .route('/subscribe')
    .post(
        isLoggedIn,
        buySubscription
    );

router
    .route('/verify')
    .post(
        isLoggedIn,
        verifySubscription
    );

router
    .route('/unsubscribe')
    .post(
        isLoggedIn,
        cancelSubscription
    );

router
    .route('/')
    .get(
        isLoggedIn,
        authorizedRole('ADMIN'),
        getAllPayments
    )


export default router;