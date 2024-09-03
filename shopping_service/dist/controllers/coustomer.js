import { getChannel, rpcRequest } from "../features/micro_utils.js";
import { Cart } from "../models/cart.js";
import { errorClass } from "../middleare/errorhandle.js";
import { Order } from "../models/order.js";
import { wishList } from "../models/wishlist.js";
const channel = await getChannel();
export const addToCart = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your cart", 401));
        const { productId, unit } = req.body;
        if (!productId || !unit)
            return next(new errorClass("Please provide both product ID and unit count", 400));
        const event = "view_product";
        const payload = { productId, event };
        const product = await rpcRequest("Product_Service", payload);
        if (!product)
            return next(new errorClass("product not found", 400));
        const cart = await Cart.findOne({ user: id });
        if (cart) {
            if (cart.items.length > 0) {
                const data = cart.items.find((item) => product._id === item.product._id);
                if (data) {
                    data.unit += unit;
                    await cart.save();
                }
                else {
                    cart.items.push({ product: product, unit: unit });
                    await cart.save();
                }
            }
            else {
                cart.items.push({ product, unit });
                await cart.save();
            }
        }
        else {
            const items = [{ product, unit }];
            await Cart.create({ items, user: id });
        }
        res.send("item added successfully");
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("Error adding product to cart", 500));
    }
};
export const removeToCart = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your cart", 401));
        const { productId, unit } = req.body;
        if (!productId || !unit)
            return next(new errorClass("Please provide both product ID and unit count", 400));
        const cart = await Cart.findOne({ user: id });
        if (!cart)
            return next(new errorClass("Please create a cart first", 400));
        const cartItems = cart.items;
        if (cartItems.length === 0)
            return next(new errorClass("There is no item in cart to remove", 400));
        const itemToRemove = cartItems.find((item) => item.product._id?.toString() === productId.toString());
        if (itemToRemove) {
            if (itemToRemove.unit > 1) {
                itemToRemove.unit -= 1;
            }
            else {
                Cart.findByIdAndUpdate(cart._id, { $pull: { items: { product: { _id: itemToRemove.product._id } } } });
            }
        }
        else {
            return next(new errorClass("Item not found in cart", 404));
        }
    }
    catch (error) {
        console.error(error);
        return next(new errorClass("Error removing product to cart", 500));
    }
};
export const createOrder = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your cart", 401));
        const cart = await Cart.findOne({ user: id });
        if (!cart)
            return next(new errorClass("Please create a cart first", 400));
        if (cart.items.length < 1)
            return next(new errorClass("Please enter product in your cart first", 400));
        let totalPrice = 0;
        cart.items.forEach((item) => {
            totalPrice += item.product.price * item.unit;
        });
        const items = cart.items;
        const order = await Order.create({ total: totalPrice, items, user: id, status: "received" });
        if (order) {
            cart.items = [];
            await cart.save();
            const yourOrders = await Order.findOne({ user: id });
            if (!yourOrders)
                return next(new errorClass("failed to get your orders", 500));
            res.json({
                success: true,
                message: "order placed successfully",
                yourOrders,
            });
        }
        else {
            return next(new errorClass("order creation failed", 400));
        }
    }
    catch (error) {
        console.error(error);
        return next(new errorClass("cannot create your order", 500));
    }
};
export const getMyOrders = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your order", 401));
        const order = await Order.findOne({ user: id });
        if (!order)
            return next(new errorClass("Please create a order first", 400));
    }
    catch (error) {
        console.error(error);
        return next(new errorClass("cannot get your orders", 500));
    }
};
export const statuaChange = async (req, res, next) => {
    try {
        const orderId = req.body;
        const order = await Order.findOne({ _id: orderId, status: "received" });
        if (!order)
            return next(new errorClass("order not found", 400));
        order.status = "delivered";
        await order.save();
    }
    catch (error) {
        console.error(error);
        return next(new errorClass("cannot get your orders", 500));
    }
};
export const addToList = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your cart", 401));
        const { productId } = req.body;
        if (!productId)
            return next(new errorClass("Please provide  product ID ", 400));
        const event = "view_product";
        const payload = { productId, event };
        const product = await rpcRequest("product_service", payload);
        if (!product)
            return next(new errorClass("product not found", 400));
        const wishlist = await wishList.findOne({ user: id });
        if (wishlist) {
            if (wishlist.items.length > 0) {
                const data = wishlist.items.find((item) => product._id === item.product._id);
                if (data) {
                    return next(new errorClass("product already added to the wishlist", 400));
                }
                else {
                    wishlist.items.push({ product: product });
                    await wishlist.save();
                }
            }
            else {
                wishlist.items.push({ product });
                await wishlist.save();
            }
        }
        else {
            const items = [{ product }];
            await wishList.create({ items, user: id });
        }
        res.send("item added successfully");
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("Error adding product to wishlist", 500));
    }
};
export const removeToList = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("You must be logged in to add items to your cart", 401));
        const { productId, unit } = req.body;
        if (!productId || !unit)
            return next(new errorClass("Please provide productId", 400));
        const wishlist = await wishList.findOne({ user: id });
        if (!wishlist)
            return next(new errorClass("Please create a wishlist first", 400));
        const wishlistItems = wishlist.items;
        if (wishlistItems.length === 0)
            return next(new errorClass("There is no item in wishlist to remove", 400));
        const itemToRemove = wishlistItems.find((item) => item.product._id?.toString() === productId.toString());
        if (itemToRemove) {
            wishList.findByIdAndUpdate(wishlist._id, { $pull: { items: { product: { _id: itemToRemove.product._id } } } });
        }
        else {
            return next(new errorClass("Item not found in wishlist", 404));
        }
    }
    catch (error) {
        console.error(error);
        return next(new errorClass("Error removing product to wishlist", 500));
    }
};
