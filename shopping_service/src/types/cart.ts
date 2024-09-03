import { Document } from "mongoose";

export interface ICart extends Document {
  items: {
    product: {
      name: string;
      price: number;
      _id: string;
      category: string;
    };
    unit: number;
  }[];
  user: string;
}