import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set domain for production
    if (process.env.NODE_ENV === "production") {
        cookieOptions.domain = "foodhubrecipe.shop";
    }

    res.cookie("token", token, cookieOptions);
    return token;
};
