import { NextFunction, Request, Response } from "express";
import { getChannel, publishMessage, rpcRequest, subscribeMessage } from "../features/micro_utils.js";
import { Cart } from "../models/cart.js";
import { errorClass } from "../middleare/errorhandle.js";
import { Order } from "../models/order.js";
import { wishList } from "../models/wishlist.js";
import { client } from "../features/redis.js";


const channel=await getChannel()
subscribeMessage(channel)
export const addToCart = async (req: Request<{},{},{productId: string, unit: number }>, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const { productId, unit } = req.body;
    if (!productId || !unit) return next(new errorClass("Please provide both product ID and unit count", 400));
    const event = "view_product";
    const payload = { productId, event };
    const product = await rpcRequest("Product_Service", payload);
    if (!product) return next(new errorClass("product not found", 400));
    const cart = await Cart.findOne({ user: id });
    if (cart) {
      if (cart.items.length > 0) {
        const data = cart.items.find((item) => product._id === item.product._id);
        if (data) {
          data.unit += unit;
          await cart.save();
        } else {
          cart.items.push({ product:product, unit:unit });
          await cart.save();
        }
      } else {
        cart.items.push({ product, unit });
        await cart.save();
      }
    } else {
      const items = [{ product, unit }];
      await Cart.create({ items, user: id });
    }
  
    client.set(`cart:${id}`, JSON.stringify(cart));
    res.send("item added successfully");
  } catch (error) {
    console.log(error);
    return next(new errorClass("Error adding product to cart", 500));
  }
};
export const removeToCart = async (req: Request<{},{},{productId: string, unit: number }>, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const { productId, unit } = req.body;
    if (!productId || !unit) return next(new errorClass("Please provide both product ID and unit count", 400));
    const cart = await Cart.findOne({ user: id });
    if (!cart) return next(new errorClass("Please create a cart first", 400));
    const cartItems = cart.items;
    if (cartItems.length === 0) return next(new errorClass("There is no item in cart to remove", 400));
    const itemToRemove = cartItems.find((item) => item.product._id?.toString() === productId.toString());
    if (itemToRemove) {
      if (itemToRemove.unit > 1) {
        itemToRemove.unit -= 1;
      } else {
        Cart.findByIdAndUpdate(cart._id, { $pull: { items: { product: { _id: itemToRemove.product._id } } } });
      }
    } else {
      return next(new errorClass("Item not found in cart", 404));
    }
  } catch (error) {
    console.error(error);
    return next(new errorClass("Error removing product to cart", 500));
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const cart = await Cart.findOne({ user: id });
    if (!cart) return next(new errorClass("Please create a cart first", 400));
    if (cart.items.length < 1) return next(new errorClass("Please enter product in your cart first", 400));
    let totalPrice: number = 0;
    cart.items.forEach((item) => {
      totalPrice += item.product.price * item.unit;
    });
    const items = cart.items;
    const order = await Order.create({ total: totalPrice, items, user: id, status: "received" });
    if (order) {
      cart.items=[];
      await cart.save();
      const yourOrders = await Order.findOne({ user: id });
      client.set(`order:${id}`, JSON.stringify(order));
      if (!yourOrders) return next(new errorClass("failed to get your orders", 500));
      
      res.json({
        success: true,
        message: "order placed successfully",
        yourOrders,
      });
    } else {
      return next(new errorClass("order creation failed", 400));
    }
  } catch (error) {
    console.error(error);
    return next(new errorClass("cannot create your order", 500));
  }
};

export const getMyOrders=async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your order", 401));
    
    if(await client.exists(`order:${id}`)){
      const cashedData=await client.get(`order:${id}`);
      res.json(cashedData)
    }else{
    const order = await Order.findOne({ user: id });
    if (!order) return next(new errorClass("Please create a order first", 400));
    await client.set(`order:${id}`, JSON.stringify(order));
   } }
  catch (error) {
    console.error(error);
    return next(new errorClass("cannot get your orders", 500));
  }
};


export const getMyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const cart = await client.get(`cart:${id}`);
    if (!cart) {
      const cartFromDB = await Cart.findOne({ user: id });
      if (!cartFromDB) return next(new errorClass("Please create a cart first", 400));
      client.set(`cart:${id}`, JSON.stringify(cartFromDB));
      res.json(cartFromDB);
    } else {
      res.json(JSON.parse(cart));
    }
  } catch (error) {
    console.error(error);
    return next(new errorClass("cannot get your cart", 500));
  }
};

export const getMyList=async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your list", 401));
    const cashedData=await client.get(`list:${id}`)
    res.json(JSON.parse(cashedData));
    if(!cashedData){
    const list = await wishList.findOne({ user: id });
    if (!list) return next(new errorClass("Please create wishlist first", 400));
    await client.set(`list:${id}`,JSON.stringify(list));
    res.json((list))
    
   } }
  catch (error) {
    console.error(error);
    return next(new errorClass("cannot get your wishlist", 500));
  }
};
export const statusChange=async (req: Request<{},{},{ordertId: string}>, res: Response, next: NextFunction) => {
  try {
      const orderId=req.body;
      const order = await Order.findOne({_id:orderId,status:"received"});
      if (!order) return next(new errorClass("order not found", 400));
      order.status="delivered";
      const result=await order.save();
      const cashedData=await client.set(`order:${order.user}`,JSON.stringify(result));
      res.send("status updataed sucessfully")
  }
  catch (error) {
    console.error(error);
    return next(new errorClass("cannot get your orders", 500));
  }
};

export const addToList= async (req: Request<{},{},{productId: string}>, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const { productId } = req.body;
    if (!productId) return next(new errorClass("Please provide  product ID ", 400));
    const event = "view_product";
    const payload = { productId, event };
    const product = await rpcRequest("product_service", payload);
    if (!product) return next(new errorClass("product not found", 400));
    const wishlist = await wishList.findOne({ user: id });
    if (wishlist) {
      if (wishlist.items.length > 0) {
        const data = wishlist.items.find((item) => product._id === item.product._id);
        if (data) {
          return next(new errorClass("product already added to the wishlist", 400));
        } else {
          wishlist.items.push({ product:product });
          await wishlist.save();
        }
      } else {
        wishlist.items.push({ product});
        await wishlist.save();
      }
    } else {
      const items = [{ product}];
      await wishList.create({ items, user: id });
    }
    await client.set(`list:${id}`,JSON.stringify(wishlist));
    res.send("item added successfully");
  } catch (error) {
    console.log(error);
    return next(new errorClass("Error adding product to wishlist", 500));
  }
};
export const removeToList = async (req: Request<{},{},{productId: string, unit: number }>, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    if (!id) return next(new errorClass("You must be logged in to add items to your cart", 401));
    const { productId, unit } = req.body;
    if (!productId || !unit) return next(new errorClass("Please provide productId", 400));
    const wishlist = await wishList.findOne({ user: id });
    if (!wishlist) return next(new errorClass("Please create a wishlist first", 400));
    const wishlistItems = wishlist.items;
    if (wishlistItems.length === 0) return next(new errorClass("There is no item in wishlist to remove", 400));
    const itemToRemove = wishlistItems.find((item) => item.product._id?.toString() === productId.toString());
    if (itemToRemove) {
      
        const result=await wishList.findByIdAndUpdate(wishlist._id, { $pull: { items: { product: { _id: itemToRemove.product._id } } } });
        await client.set(`list:${id}`,JSON.stringify(result));
      }
     else {
      return next(new errorClass("Item not found in wishlist", 404));
    }}
   catch (error) {
    console.error(error);
    return next(new errorClass("Error removing product to wishlist", 500));
  }
};

export const handleSubscribeEvent=async (req: Request, res: Response, next: NextFunction,payload:any) => {
  try {
      const {
        data,event,msg
      }=payload
      switch (event){
        case "delete_profile":
          deleteProfile(next,data,res);
          console.log(msg)
          break;
        default:
          console.log("event is listening")

      }
  }
  catch (error) {
    console.error(error);
    return next(new errorClass("Error removing product to wishlist", 500));
  }
};
export const deleteProfile=async ( next: NextFunction,data:any,res:Response) => {
  try { 
    const {id} =data;
    const order =await Order.findOneAndDelete({user:id});
    if (!order) return next(new errorClass("order not found", 400));
    if(await client.exists(`order:id`)) await client.delete(`order:${id}`)
    const cart =await Cart.findOneAndDelete({user:id});
    if (!cart) return next(new errorClass("cart not found", 400));
    if(await client.exists(`cart:id`)) await client.delete(`cart:${id}`)
    const list =await wishList.findOneAndDelete({user:id});
    if (!list) return next(new errorClass("list not found", 400));
    if(await client.exists(`list:id`)) await client.delete(`list:${id}`)
    res.send("everyThing of that user is not deleted")
   }
  catch (error) {
    console.error(error);
    return next(new errorClass("Error deleting data of the user", 500));
  }
};
