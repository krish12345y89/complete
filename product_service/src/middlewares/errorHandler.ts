import {Request , Response , NextFunction} from "express"
export const errorHandler=async(err:errorClass,req:Request,res:Response,next:NextFunction)=>{
    err.message||="internal server error " ;
    err.statusCode||=500
    res.json({success:false,
        message:err.message
    }).status(err.statusCode)
    
}
export class errorClass extends Error{
     
     constructor(public message:string,public statusCode:number){
        super(message)
        this.statusCode=statusCode
     }

}