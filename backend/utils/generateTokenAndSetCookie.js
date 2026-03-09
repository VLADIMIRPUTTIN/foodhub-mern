import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

export const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        domain: isProd ? ".foodhubrecipes.site" : undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
};