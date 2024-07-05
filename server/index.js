import { configDotenv } from "dotenv";
import connectDB from "./config/dbConnection.js";
import { app } from "./app.js"
import cloudinary from "cloudinary";
import Razorpay from "razorpay";


configDotenv({
    path: "./.env"
})

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINART_CLOUD_NAME,
    api_secret: process.env.CLOUDINART_API_SECRET,
    api_key: process.env.CLOUDINART_API_KEY,
});

const  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

connectDB()
    .then(() => {
        // Also we include app.on for error listen.
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })


module.exports = razorpay;