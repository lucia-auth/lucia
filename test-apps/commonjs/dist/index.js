var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./lucia", "express", "zod"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const lucia_1 = require("./lucia");
    const express_1 = __importDefault(require("express"));
    const zod_1 = require("zod");
    const registerSchema = zod_1.z.object({
        username: zod_1.z.string(),
        password: zod_1.z.string()
    });
    const app = (0, express_1.default)();
    app.get("/register", async (req, res) => {
        const data = registerSchema.safeParse(req.body);
        if (!data.success) {
            res.status(400).send("Invalid data");
            return;
        }
        const { username, password } = data.data;
        const user = (await lucia_1.auth).createUser({
            key: {
                providerId: "username",
                providerUserId: username,
                password
            },
            attributes: {
                username
            }
        });
        res.send(user);
    });
});
