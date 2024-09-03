import express from "express";
import { config } from "dotenv";
import cors from "cors"
import mongoose from "mongoose";
import { connectDB } from "./features/connnectDB.js";
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import { errorHandler } from "./middleare/errorhandle.js";
import shoppingRouter from "./routes/shopping.js"
import { getChannel } from "./features/micro_utils.js";

config();
const app=express();
app.use(cors())
app.use(express.json({limit:"1mb"}))
app.use(bodyParser.urlencoded({limit:"1 mb",extended:true}))
app.use(cookieParser())


const PORT=process.env.PORT as string
const URI =process.env.URI as string
app.listen(PORT,()=>{
    console.log(`app is listening ${PORT}`)
})
connectDB(mongoose, URI);
app.use("/shopping",shoppingRouter);
app.use(errorHandler)
getChannel();