import { Router } from "express";
import { deleteUser, getMyProfile, login, logOut, signUp, updateUser } from "../controllers/user.js";
import { upload } from "../middleare/multer.js";
import { auth } from "../middleare/auth.js";

const app=Router();
app.post("/signUp",upload,signUp);
app.post("/signIn",login);
app.use(auth)
app.get("/me",getMyProfile)
app.put("/updateMe",upload,updateUser);
app.post("/deleteMe",deleteUser);

app.get("/logOut",logOut)
export default app;