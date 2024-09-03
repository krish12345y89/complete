import {createClient} from "redis";
import { errorClass } from "../middlewares/errorHandler.js";
import { NextFunction } from "express";
const url=process.env.REDS_URL as string;
export const client:any=async(next:NextFunction)=>{createClient({
  url:url
}).on("error",(error:any)=>{
console.log(error.message)
}).connect().then(()=>{
  next(new errorClass("errorcreating to channel",500))
  console.log("connected to the dataBase")}).catch((error:any)=>{
  next(new errorClass("errorcreating to channel",500))
  console.log(error.message,error.status)})
}