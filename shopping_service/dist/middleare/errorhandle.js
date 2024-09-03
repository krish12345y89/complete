export const errorHandler = async (err, req, res, next) => {
    err.message || (err.message = "internal server error ");
    err.statusCode || (err.statusCode = 500);
    res.json({ success: false,
        message: err.message
    }).status(err.statusCode);
};
export class errorClass extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.statusCode = statusCode;
    }
}
