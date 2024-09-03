import { NextFunction,Request, Response } from "express";
import { errorClass } from "../middlewares/errorHandler.js";
import { Product } from "../models/product.js";
import {v4 as uuid} from "uuid"
import { ObjectId } from "mongoose";
import { rpcObserver } from "../features/micro_utils.js";
import { client } from "../features/redis.js";

let next:any;
rpcObserver("Product_Service",next)
export const createNew=async (req:Request<{},{},{name:string,price:number,stock:number,category:string,}>,res:Response,next:NextFunction)=> {
    try {
    const {name,category,price,stock}=req.body;
    const file=req.file;
    const id=uuid();
    if( !name|| !price|| !stock|| !file|| !category) return next(new errorClass("please enter all fields",400));
    const avatar={
        url:file.buffer.toString('base64'),
        public_id:id
    }
    const product=new Product({name,price,stock,category,avatar});
    await product.save();
    const key=`product:${product._id}`
    await client.set(key,JSON.stringify(product));
    res.json({
        sucess:true,
        message:"product created  successfully"
    }).status(201)
    }
    catch(error:any){
        console.log(error.message)
        return next(new errorClass("failed to create user, please try again or try later!",500));
    }
}
export const allProducts = async (req: Request<{},{},{},{page:number,price:number,category:string}>, res: Response, next: NextFunction) => {
    try {
      const limit: number = 20;
      const { page, price, category } = req.query;
      const query: { price?: { $lte: number }, category?: string } = {};
      if (price) query.price = { $lte: price };
      if (category) query.category = category;
  
      const cashedKey = `product:${price}:${page}:${category}`;
      const skip: number = Math.floor(limit * (page - 1));
  
      const cachedData = await client.get(cashedKey);
      if (cachedData) {
        res.json({
          success: true,
          products: JSON.parse(cachedData)
        });
        return;
      }
    else{
      const products = await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
      if (!products) return next(new errorClass("products not products", 400));
  
      await client.set(cashedKey, JSON.stringify(products)); 
  
      res.json({
        success: true,
        products
      });}
    } catch (error: any) {
      console.log(error.message)
      return next(new errorClass("failed to get products", 500));
    }
  };

export const getProduct=async (req:Request<{productId:ObjectId}>,res:Response,next:NextFunction)=> {
    try {
        const {productId}=req.params;
        if(!productId) return next(new errorClass("please provide productId",400));
        const key=`product:${productId}`
        if(client.exists(key)) {
            const cashedData=await client.get(key)
            res.json({
                success:true,
                products:JSON.parse(cashedData)
            })
        }
        else{
        const product=await Product.findById(productId);
        if(!product) return next(new errorClass("product not found",400));
        res.json({
            success:true,
            product
        })}
    }
    catch(error:any){
        return next(new errorClass("failed to get product",500));
    }}

 



    export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const {name,category,price,stock}=req.body;
            const file=req.file;
            const {productId}=req.params;
            const key=`product:${productId}`
          
            if(!productId) return next(new errorClass("please provie productId",400));
            const product=await Product.findById(productId);
            if(!product) return next(new errorClass("product not found",400));
            const  query:{
                name?:string,
                category?:string,
                file?:{url:string},
                price?:number,
                stock?:number
            }={};
            if(name)  query.name=name;
            if(stock)  query.stock;
            if(price)  query.price=price
            if(category) query.category=category;
            if(file)  query.file={url:file.buffer.toString('base64')}
            const result=await product.updateOne({$set: query})
            await client.set(key);
     
            res.send("user updated successfully")
    
        }
        catch(error:any){
            console.log(error)
            return next(new errorClass("failed to update user",500));
    }
    }

    export const deleteProduct=async(req:Request<{productId:ObjectId}>,res:Response,next:NextFunction)=>{
        try{
            const {productId}=req.params;
            if(!productId) return next(new errorClass("please provide productId",401));
            const product=await Product.findOneAndDelete(productId);
            if(!product) return next(new errorClass("product not found",400));
            const key=`product:${productId}`;
            if(await client.exists(key)) client.delete(key);
            res.send("user deleted successfully")
    
        }
        catch(error:any){
            console.log(error)
            return next(new errorClass("failed to delete product",500));
    
        }
    }
export const getSelectedProducts=async(productIds:string[],next:NextFunction)=>{
    try{    
          
          const productsArray=Promise.all(productIds.map(async(productId)=>{
            let key=`product:${productId}`;
            if(client.has(key)) {
                await JSON.parse(client.get(key))
            }
            else{
                await Product.findById(productId);}
            }))
        
            return productsArray;
    }
    catch(error:any){
        console.log(error)
        return next(new errorClass("failed to get products",500));

    }
}
export const getSingleProduct:any=async(productId:string,next:NextFunction)=>{
    try{    
        const key=`product:${productId}`;
        if(client.has(key)) {
            const product=await client.get(key)
            return JSON.parse(product)
            }
        
        else{
        
            const product= await Product.findById(productId,"name category price stock");
            
            return product;
    }}
    catch(error:any){
        console.log(error)
        return next(new errorClass("failed to get product",500));

    }
}
// rpcObserver("Product_service");
export const requestServe=async(payload:any,next:NextFunction)=>{
    try{
        const {data,event}=payload;
        switch (event){
            case "view_product":
                getSingleProduct(data,next);
                break;
            case "get_selectedProducts" :
                getSelectedProducts(data,next);
                break;
           
        }
            
    }
    catch(error:any){
        console.log(error)
        return next(new errorClass("failed to get product",500));

    }
}