import { errorClass } from "../middlewares/errorHandler.js";
import { Product } from "../models/product.js";
import { v4 as uuid } from "uuid";
import { rpcObserver } from "../features/micro_utils.js";
import { client } from "../features/redis.js";
let next;
rpcObserver("Product_Service", next);
export const createNew = async (req, res, next) => {
    try {
        const { name, category, price, stock } = req.body;
        const file = req.file;
        const id = uuid();
        if (!name || !price || !stock || !file || !category)
            return next(new errorClass("please enter all fields", 400));
        const avatar = {
            url: file.buffer.toString('base64'),
            public_id: id
        };
        const product = new Product({ name, price, stock, category, avatar });
        await product.save();
        const key = `product:${product._id}`;
        await client.set(key, JSON.stringify(product));
        res.json({
            sucess: true,
            message: "product created  successfully"
        }).status(201);
    }
    catch (error) {
        console.log(error.message);
        return next(new errorClass("failed to create user, please try again or try later!", 500));
    }
};
export const allProducts = async (req, res, next) => {
    try {
        const limit = 20;
        const { page, price, category } = req.query;
        const query = {};
        if (price)
            query.price = { $lte: price };
        if (category)
            query.category = category;
        const cashedKey = `product:${price}:${page}:${category}`;
        const skip = Math.floor(limit * (page - 1));
        const cachedData = await client.get(cashedKey);
        if (cachedData) {
            res.json({
                success: true,
                products: JSON.parse(cachedData)
            });
            return;
        }
        else {
            const products = await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
            if (!products)
                return next(new errorClass("products not products", 400));
            await client.set(cashedKey, JSON.stringify(products));
            res.json({
                success: true,
                products
            });
        }
    }
    catch (error) {
        console.log(error.message);
        return next(new errorClass("failed to get products", 500));
    }
};
export const getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        if (!productId)
            return next(new errorClass("please provide productId", 400));
        const key = `product:${productId}`;
        if (client.exists(key)) {
            const cashedData = await client.get(key);
            res.json({
                success: true,
                products: JSON.parse(cashedData)
            });
        }
        else {
            const product = await Product.findById(productId);
            if (!product)
                return next(new errorClass("product not found", 400));
            res.json({
                success: true,
                product
            });
        }
    }
    catch (error) {
        return next(new errorClass("failed to get product", 500));
    }
};
export const updateProduct = async (req, res, next) => {
    try {
        const { name, category, price, stock } = req.body;
        const file = req.file;
        const { productId } = req.params;
        const key = `product:${productId}`;
        if (!productId)
            return next(new errorClass("please provie productId", 400));
        const product = await Product.findById(productId);
        if (!product)
            return next(new errorClass("product not found", 400));
        const query = {};
        if (name)
            query.name = name;
        if (stock)
            query.stock;
        if (price)
            query.price = price;
        if (category)
            query.category = category;
        if (file)
            query.file = { url: file.buffer.toString('base64') };
        const result = await product.updateOne({ $set: query });
        await client.set(key);
        res.send("user updated successfully");
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to update user", 500));
    }
};
export const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        if (!productId)
            return next(new errorClass("please provide productId", 401));
        const product = await Product.findOneAndDelete(productId);
        if (!product)
            return next(new errorClass("product not found", 400));
        const key = `product:${productId}`;
        if (await client.exists(key))
            client.delete(key);
        res.send("user deleted successfully");
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to delete product", 500));
    }
};
export const getSelectedProducts = async (productIds, next) => {
    try {
        const productsArray = Promise.all(productIds.map(async (productId) => {
            let key = `product:${productId}`;
            if (client.has(key)) {
                await JSON.parse(client.get(key));
            }
            else {
                await Product.findById(productId);
            }
        }));
        return productsArray;
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to get products", 500));
    }
};
export const getSingleProduct = async (productId, next) => {
    try {
        const key = `product:${productId}`;
        if (client.has(key)) {
            const product = await client.get(key);
            return JSON.parse(product);
        }
        else {
            const product = await Product.findById(productId, "name category price stock");
            return product;
        }
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to get product", 500));
    }
};
// rpcObserver("Product_service");
export const requestServe = async (payload, next) => {
    try {
        const { data, event } = payload;
        switch (event) {
            case "view_product":
                getSingleProduct(data, next);
                break;
            case "get_selectedProducts":
                getSelectedProducts(data, next);
                break;
        }
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to get product", 500));
    }
};
