import { errorClass } from "../middlewares/errorHandler.js";
import { Product } from "../models/product.js";
import { v4 as uuid } from "uuid";
import { rpcObserver } from "../features/micro_utils.js";
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
        const query = {
            page: 1,
            category: "",
        };
        const skip = Math.floor(limit * (page - 1));
        if (page)
            query.price = { $lte: price };
        if (category)
            query.category = category;
        if (page)
            query.page = page;
        const products = await Product.find({ query }).skip(skip).limit(limit).sort({ createdAt: -1 });
        if (!products)
            return next(new errorClass("products not products", 400));
        res.json({
            success: true,
            products
        });
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
        const product = await Product.findById(productId);
        if (!product)
            return next(new errorClass("product not found", 400));
        res.json({
            success: true,
            product
        });
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
        product?.updateOne({ $set: query });
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
        res.send("user deleted successfully");
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to delete product", 500));
    }
};
export const getSelectedProducts = async (productIds, next) => {
    try {
        const productsArray = Promise.all(productIds.map(async (product) => {
            await Product.findById(product);
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
        const product = await Product.findById(productId, "name category price stock");
        return product;
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
