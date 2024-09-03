import mongoose from "mongoose";
const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    product: [
        {
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            category: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            stock: {
                type: Number,
                required: true
            },
        }
    ],
}, { timestamps: true });
export const Coustomer = mongoose.model("Coustomer", schema);
