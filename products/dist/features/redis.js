import { createClient } from "redis";
import { errorClass } from "../middlewares/errorHandler.js";
const url = process.env.REDS_URL;
export const client = async (next) => {
    createClient({
        url: "redis://default:oGfrq2Lil9Wdm6NE4gJ1QUVpINvcXNhX@redis-18915.c305.ap-south-1-1.ec2.redns.redis-cloud.com:18915"
    }).on("error", (error) => {
        console.log(error.message);
    }).connect().then(() => {
        console.log("connected to the dataBase");
    }).catch((error) => {
        next(new errorClass("errorcreating to channel", 500));
        console.log(error.message, error.status);
    });
};
