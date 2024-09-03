import mongoose from "mongoose";
import {Iuser} from "../types/user.js"
const schema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    
    username:{
        type:String,
        required:true,
    },
    avatar:{
        url:{
            type:String,
            required:true
        },
        public_id:{
            type:String,
            required:true
        }},
        address:[{
            type:mongoose.Types.ObjectId,
            ref:"Address"
        }
        ]
    

},{timestamps:true})

export const User=mongoose.model<Iuser>("User",schema);