import mongoose from "mongoose";
import { IAddress } from "../types/Address.js";
const schema =new mongoose.Schema({
    street:{
        type:String,
        required:true
    },
    pinCode:{
        type:Number,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    nearByPlace:{
        type:String,
        required:true
    }
},{timestamps:true})
export const Address=mongoose.model<IAddress>("Address",schema)