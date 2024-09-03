import {createClient} from "redis";

import { NextFunction } from "express";
import { errorClass } from "../middleare/errorhandle.js";
const url=process.env.REDS_URL as string;
const client:any=async(next:NextFunction)=>{createClient({
  url:url
}).on("error",(error:any)=>{
console.log(error.message)
}).connect().then(()=>{
  next(new errorClass("errorcreating to channel",500))
  console.log("connected to the dataBase")}).catch((error:any)=>{
  next(new errorClass("errorcreating to channel",500))
  console.log(error.message,error.status)})
}