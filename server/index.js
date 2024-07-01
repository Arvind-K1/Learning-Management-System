import { configDotenv } from "dotenv";
import connectDB from "./config/dbConnection.js";
import { app } from "./app.js"

configDotenv({
    path: "./.env"
})

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
