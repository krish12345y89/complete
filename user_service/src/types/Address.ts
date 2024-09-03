import {Document} from "mongoose"
export interface IAddress extends Document{
    street:string;
    pinCode:number;
    city:string;
    state:string;
    nearByPlace:string;
    createdAt:Date;
    updatedAt:string;
    
} 