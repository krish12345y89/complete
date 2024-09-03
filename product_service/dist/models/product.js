import mongoose from "mongoose";
const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter Product name"]
    },
    price: {
        type: Number,
        required: [true, "please enter Product price"]
    },
    category: {
        type: String,
        required: [true, "please enter Product category"]
    },
    stock: {
        type: Number,
        required: [true, "please enter Product stock"]
    },
    avatar: {
        url: {
            type: String,
            required: [true, "please upload avatar"]
        },
        public_id: {
            type: String,
            required: [true, "please enter public_id"]
        }
    }
}, {
    timestamps: true
});
export const Product = mongoose.model("Product", schema);
