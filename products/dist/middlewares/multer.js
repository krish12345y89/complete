import multer from "multer";
const storage = multer.memoryStorage();
export const file = multer({ storage: storage, limits: { fileSize: 256 * 1024 } }).single("filename");
