import {Router} from "express"
import { allProducts, createNew, deleteProduct,updateProduct, getSingleProduct } from "../controllers/product.js";
import { file } from "../middlewares/multer.js";
import { auth } from "../middlewares/auth.js";
const app=Router();
app.use(auth);
app.post("/new",file,createNew);
app.get("/",allProducts);
app.route("/:id").get(getSingleProduct).post(file,updateProduct).delete(deleteProduct);

export default app;