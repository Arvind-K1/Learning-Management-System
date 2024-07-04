import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { stringify } from "querystring";
import { type } from "os";

const userSchema = new mongoose.Schema({
    fullName : {
        type : String,
        required : [true, 'Please provide your full Name'],
        minLength : [5, 'Your name must be at least 5 characters'],
        maxLength : [50, 'Your name must be less than 50 characters'],
        lowercase : true,
        trim : true
    },
    email : {
        type : String,
        required : [true, 'Please provide your email'],
        unique : [true, 'Email already registered'],
        lowercase : true,
        trim : true,
        match : ['/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/','Please fill in valid email address']
    },
    password : {
        type : String,
        required : [true, 'Please provide your password'],
        minLength : [8, 'Your password must be at least 8 characters'],
        select : false // This will hide the password field while fetching data from database.
    },
    role : {
        type : String,
        enum : ['USER','ADMIN'],
        default : 'USER'
    },
    avatar : {
        public_id : {
            type : String
        },
        secure_url : {
            type : String
        },
        forgotPasswordToken : String,
        forgotPasswordExpiry : Date,
        subscription : {
            id : String,
            status : String
        }
    }
},{
    timestamps : true
});

userSchema.pre('save', async function(next){
    if (!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods = {
    comparePassword : async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword, this.password);
    },
    generateJWTToken : function(){
        return jwt.sign({
            id: this._id,
            role: this.role,
            email: this.email,
            subscription: this.subscription
        },
    process.env.JWT_SECRET,
    {
        expiresIn: process.env.JWT_EXPIRY
    });

    },
    generatePasswordToken : async function(){
        const token = crypto.randomBytes(20).toString('hex');
        
        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        this.forgotPasswordExpiry = Date.now() + 15*60*1000; //15 min from now

        return resetToken;
    }
}

const User = mongoose.model('User',userSchema);

export default User