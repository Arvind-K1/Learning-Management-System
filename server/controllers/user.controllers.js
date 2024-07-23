import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';

//import from utils
import {sendEmail} from '../utils/sendEmail.js';
import {AppError} from '../utils/appError.js';

import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import crypto from 'crypto';

const cookieOptions = {
    secure: process.env.NODE_ENV === 'production' ? true : false,
    maxAge: 7*24*60*60*1000,
    httpOnly: true
};

const register = asyncHandler( async (req,res,next) => {
    const {fullName, email, password} = req.body;
    
    if(!fullName || !email || !password){
        return next(new AppError('Please fill all the fields',400));
    }

    const userExists = await User.findOne({email});

    if( userExists ){
        return next(new AppError('User already exists',400));
    }
    const user = await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: ""
        }
    });

    if (!User){
        return next(new AppError('User not created',400));
    }

    if (req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });

            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                //remove file from local server
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(new AppError(e.message || 'file not uploaded, please try again',500))
        }
    }
    await user.save();

    const token = await user.generateJWTToken();

    user.password = undefined;

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        message: 'User registered Successfully',
        user
    })
});

const login = asyncHandler( async (req,res,next) => {
    const {email, password} = req.body;

    if(!email || !password){
        return next(new AppError('Please provide email and password',400));
    }

    const user = await User.findOne({email}).select('+password');

    if (!(user && (await user.comparePassword(password)))) {
        return next(
          new AppError('Email or Password do not match or user does not exist', 401)
        );
      }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie('token',token,cookieOptions);

    res.status(201).json({
        success: true,
        message: 'User logged in successfully',
        user
    })
});

const logout = asyncHandler(async (_req,res,_next) => {
    res.cookie('token',null,{
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 0,
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })
});

const getProfile = asyncHandler(async (req,res,_next) => {
    const user = User.findById(req.user.id);

    res.status(200).json({
        success: true,
        message: 'User profile fetched successfully',
        user
    })
});

const forgotPassword = asyncHandler( async (req,res,next) => {
    const {email} = req.body;

    if(!email){
        return next(new AppError('Please provide email',400));
    }

    const user = await User.findOne({email});

    if(!user){
        return next(new AppError('User with this email does not exist',400));
    }

    const resetToken = await user.generatePasswordToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password';

    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your Password </a> \nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignored `

    try{
        await sendEmail(email,subject,resetPasswordUrl);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully!`
        })

    }
    catch(e){
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save();

        return next(new AppError(e.message,500));
    }

});

const resetPassword = asyncHandler( async (req,res,next) => {
    const {resetToken} = req.params;
    const {password} = req.body;

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    if (!password) {
        return next(new AppError('Password is required', 400));
    }

    const user = User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if(!user){
        return next(new AppError('Token is invalid or has expired',400));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    })
});

const changePassword = asyncHandler( async (req,res,next) => {
    const {oldPassword,newPassword} = req.body;
    const {id} = req.user;

    if(!oldPassword || !newPassword){
        return next(new AppError('Please provide old and new password',400));
    }

    const user = await User.findById(id).select('+password');

    if(!user){
        return next(new AppError('User does not exist',400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if(!isPasswordValid){
        return next(new AppError('Old password is incorrect',400));
    }

    user.password = newPassword;
    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    })
});

const updateUser = asyncHandler( async (req,res,next) => {
    const {fullName} = req.body;
    const {id} = req.user;

    const user = await User.findById(id);

    if(!user){
        return next(new AppError('User does not exist',400));
    }

    if(fullName){
        user.fullName = fullName;
    }

    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height:250,
                gravity: 'faces',
                crop: 'fill'
            });
    
            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
    
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(
                new AppError(error || 'File not uploaded, please try again', 400)
              );
        }
        
        
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "User updated successfully"
    })
});


export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}
