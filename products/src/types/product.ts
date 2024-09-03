import { Document } from "mongoose";

export interface Iproduct  extends Document{
    name:string;
    avatar:{
        url:string;
        public_id:string;
    }
    price:number;
    stock:number;
    category:string;
    updatedAt:string;
    createdAt:string;
}