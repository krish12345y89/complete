import {Document} from "mongoose"
import { IAddress } from "./Address.js";
export interface Iuser extends Document{
    name:string;
    email:string;
    password:string;
    createdAt:Date;
    updatedAt:string;
    avatar:{
        url:string,
        publlic_id:string
    };
    address:IAddress[];
} 