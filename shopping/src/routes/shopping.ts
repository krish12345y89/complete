import { Router } from "express";

import { auth } from "../middleare/auth.js";
import { addToCart,removeToList,getMyOrders,getMyCart,getMyList,statusChange,removeToCart, addToList, createOrder } from "../controllers/coustomer.js";


const app=Router();
app.use(auth);
app.post("/addToCart",addToCart);
app.post("/addToList",addToList);
app.post("/removeToCart",removeToCart);
app.post("/removeToCart",removeToList);
app.post("/createOrder",createOrder);
app.get("/myOrders",getMyOrders);
app.get("/myCart",getMyCart);
app.get("/myList",getMyList);
app.get("/status",statusChange);


export default app;