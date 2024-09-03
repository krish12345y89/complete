import { Document } from "mongoose";

export interface IWishList extends Document {
  items: {
    product: {
      name: string;
      price: number;
      _id: string;
      category: string;
    }
  }[];
  user: string;
}