import AppError from "../utils/appError.js";
import jwt from 'jsonwebtoken';

const isLoggedIn = function(req,res,next){
    const {token} = req.cookies;

    if(!token){
        return next(new AppError('You are not logged in',401));
    }

    const tokenDetails = jwt.verify(token,process.env.JWT_SECRET);

    if(!tokenDetails){
        return next(new AppError('The token has expired',401));
    }

    req.user = tokenDetails;
    next();
};

const authorizedRole = (...roles) => (req,res,next) => {
    const currntRole = req.user.role;

    if(!roles.includes(currntRole)){
        return next(new AppError('You are not authorized to perform this action',403));
    }
    next();
}

const authorizedSubscriber = async (req,res,next) => {
    const subscriptionStatus = req.user.subscription.status;
    const currentRole = req.user.role;

    if(currentRole !== 'ADMIN' && subscriptionStatus !== 'active'){
        return next(new AppError('You are not authorized to perform this action',403));
    }
    next();
}

export {
    isLoggedIn,
    authorizedRole,
    authorizedSubscriber
}