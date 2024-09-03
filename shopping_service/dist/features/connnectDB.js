export const connectDB = (mongoose, URI) => {
    mongoose.connect(URI).then(() => console.log("db is connected"));
};
