import mongoose from "mongoose";
const schema=new mongoose.Schema({
   status:{
    type:String,
    enum:["pending","delivered","rejected","received"],
    default:"pending"
   },
   user:{
     type:String,
        required:true
    },
    total:{
        type:Number,
        required:true
    },
    items:[
        {
            Product:{
                name:{
                    type:String,
                       required:true
                   },
                   category:{
                    type:String,
                       required:true
                   },
                   price:{
                    type:Number,
                       required:true
                   },

                   },
            unit:{
            type:Number,
               required:true
                }
        }
         ]

},
{timestamps:true})
export const Order=mongoose.model("Order",schema)