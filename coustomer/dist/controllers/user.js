import jwt from "jsonwebtoken";
import { errorClass } from "../middleare/errorhandle.js";
import { v4 as uuid } from "uuid";
import { compare, hash } from "bcrypt";
import { User } from "../models/user.js";
import { Address } from "../models/address.js";
import { getChannel, publishMessage } from "../features/micro_utils.js";
import { client } from "../utils/redis.js";
const SECRET_KEY = process.env.SECRET_KEY;
export const signUp = async (req, res, next) => {
    try {
        const { name, email, password, username } = req.body;
        const file = req.file;
        if (!name || !email || !password || !file || !username) {
            return next(new errorClass("please enter all fields", 400));
        }
        const id = uuid();
        const hashedPass = await hash(password, 10);
        const user = {
            name,
            email,
            password: hashedPass,
            avatar: {
                public_id: id,
                url: file.buffer.toString('base64')
            },
            username
        };
        const data = await User.create(user);
        const users = await User.findById(data._id, "userName name email avatar.url");
        client.set(`user:${data._id}`, JSON.stringify(users));
        res.json({
            sucess: true,
            message: `${username} created sucessfully`
        });
    }
    catch (error) {
        console.log(error);
        if (error.code === 11000 && "email" in error.keyValue)
            return next(new errorClass("email already eists", 400));
        if (error.code === 11000 && "username" in error.keyValue)
            return next(new errorClass("username already eists", 400));
        return next(new errorClass("failed to create user", 500));
    }
};
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new errorClass("please enter all fields", 400));
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return next(new errorClass("email not found", 400));
        }
        const match = await compare(password, user.password);
        if (!match) {
            return next(new errorClass("invalid username or password", 400));
        }
        const token = jwt.sign({ id: user._id }, SECRET_KEY);
        res.cookie("token", token, { maxAge: 15 * 60 * 60 * 1000, httpOnly: true }).json({
            sucess: true,
            message: ` welcome ${user.name}`
        });
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("something went wrong!, please try again or some time later!", 500));
    }
};
export const getMyProfile = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (await client.exists(`user:${id}`)) {
            res.send(await client.get(`user:${id}`));
        }
        else {
            if (!id)
                return next(new errorClass("please login first", 401));
            const user = await User.findById(id, "userName name email avatar.url address ");
            if (!user)
                return next(new errorClass("user not found", 400));
            client.set(`user:${id}`, JSON.stringify(user));
            res.send(user);
        }
    }
    catch (error) {
        return next(new errorClass("something went wrong!, please try again or some time later!", 500));
    }
};
export const logOut = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("please login first", 401));
        const user = await User.findById(id);
        if (!user)
            return next(new errorClass("user not found", 400));
        res.cookie("token", "", { maxAge: 0 }).send("logout sucessfully");
    }
    catch (error) {
        return next(new errorClass("something went wrong!, please try again or some time later!", 500));
    }
};
export const updateUser = async (req, res, next) => {
    try {
        const { name, username, email } = req.body;
        const { id } = req.user;
        if (!id)
            return next(new errorClass("please login first", 401));
        const user = await User.findById(id);
        if (!user)
            return next(new errorClass("please login first", 401));
        const file = req.file;
        if (!name && !username && email && file)
            return next(new errorClass("please enter any field to change", 400));
        const query = {};
        if (name)
            query.name = name;
        if (email)
            query.email = email;
        if (file)
            query.file = { url: file.buffer.toString('base64') };
        const data = await user.updateOne({ $set: query }).select("-password");
        if (await client.exists(`user:${id}`)) {
            await client.del(`user:${id}`);
            await client.set(`user:${id}`, JSON.stringify(data));
        }
        else {
            await client.set(`user:${id}`, JSON.stringify(data));
        }
        res.send("user updated successfully");
    }
    catch (error) {
        console.log(error);
        if (error.code === 11000 && "email" in error.keyValue)
            return next(new errorClass("email already eists", 400));
        if (error.code === 11000 && "username" in error.keyValue)
            return next(new errorClass("username already eists", 400));
        return next(new errorClass("failed to update user", 500));
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id)
            return next(new errorClass("please login first", 401));
        const user = await User.findOneAndDelete(id);
        if (!user)
            return next(new errorClass("user not found", 400));
        const channel = await getChannel();
        if (!channel)
            return next(new errorClass("channel not found", 400));
        const event = "delete_profile";
        const data = id;
        const msg = "delete all the data of user from shopping service";
        const payload = { data, event, msg };
        publishMessage(channel, "shopping_service", payload);
        if (await client.exists(`user:${id}`)) {
            await client.del(`user:${id}`);
        }
        res.send("user deleted successfully");
    }
    catch (error) {
        console.log(error);
        if (error.code === 11000 && "email" in error.keyValue)
            return next(new errorClass("email already eists", 400));
        if (error.code === 11000 && "username" in error.keyValue)
            return next(new errorClass("username already eists", 400));
        return next(new errorClass("failed to update user", 500));
    }
};
export const addAddress = async (req, res, next) => {
    try {
        const { street, pinCode, city, state, nearByPlace } = req.body;
        if (!street || !pinCode || !city || !state || !nearByPlace) {
            return next(new errorClass("please enter all fields", 400));
        }
        const address = { street, pinCode, city, state, nearByPlace };
        const { id } = req.user;
        if (!id)
            return next(new errorClass("please login first", 401));
        const user = await User.findById(id);
        if (!user)
            return next(new errorClass("please login first", 401));
        const addresses = new Address(address);
        if (user.address.length < 3) {
            user.address.push(addresses);
            await user.save();
            await client.set(`address:${id}`, JSON.stringify(user.address));
            await client.set(`user:${id}`, JSON.stringify(user));
            res.send("address updated sucessfully");
        }
        else {
            return next(new errorClass("address can not be more than 3", 400));
        }
    }
    catch (error) {
        console.log(error);
        return next(new errorClass("failed to add address", 500));
    }
};
