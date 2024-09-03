import { Mongoose } from "mongoose"

export const connectDB=(mongoose:Mongoose,URI:string)=>{
    mongoose.connect(URI).then(()=>console.log("db is connected"))
}