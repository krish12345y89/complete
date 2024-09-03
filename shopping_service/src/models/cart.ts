import mongoose from "mongoose";
import { ICart } from "../types/cart.js";

const schema = new mongoose.Schema({
  items: [
    {
      product: {
        name: {
          type: String,
          required: true
        },
        _id: {
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
        }
      },
      unit: {
        type: Number,
        required: true
      }
    }
  ],
  user: {
    type: String,
    required: true
  }
}, { timestamps: true });

export const Cart = mongoose.model<ICart>("Cart", schema);