import mongoose from "mongoose";
const schema = new mongoose.Schema({
    street: {
        type: String,
        required: true
    },
    pinCode: {
        type: Number,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    nearByPlace: {
        type: String,
        required: true
    }
}, { timestamps: true });
export const Address = mongoose.model("Address", schema);
