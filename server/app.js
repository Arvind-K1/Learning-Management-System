import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

//importing middleware
import errorMiddleware from "./middlewares/error.middleware.js";
const app = express();

app.use(express.json());

app.use(cors({
    origin: [process.env.FRONTEND],
    credentials: true
}));

app.use(morgan('dev'));
app.use(cookieParser());

// importing Routes 
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import paymentRoutes from "./routes/payment.routes.js"

app.use('/api/v1/user',userRoutes);
app.use('/api/v1/course',courseRoutes);
app.use('/api/v1/payment',paymentRoutes);

app.use('*',(req,res) => {
    res.status(404).send("OPPS!! 404 page not found")
})

app.use(errorMiddleware)

export default app