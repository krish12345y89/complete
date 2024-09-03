"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const connectDB = (mongoose, URI) => {
    mongoose.connect(URI).then(() => console.log("db is connected"));
};
exports.connectDB = connectDB;
