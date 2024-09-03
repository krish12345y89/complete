import {Request , Response , NextFunction, response} from "express"
import jwt from "jsonwebtoken"
import { errorClass } from "./errorhandle.js";
const SECRET_KEY=process.env.SECRET_KEY as string
export const auth=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const token=req.cookies.token;
        if (!token) return next(new errorClass("please login first",400))
        const verify= jwt.verify(token,SECRET_KEY);
        if (!verify) return next(new errorClass("invalid token",400));
        (req as any).user=verify
        next()
    }
    catch(error){
        return next(new errorClass("failed to authenticate user",500));
    }
}
