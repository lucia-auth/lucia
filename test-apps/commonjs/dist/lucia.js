var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@prisma/client", "./imports", "zod"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.githubAuth = exports.auth = void 0;
    const client_1 = require("@prisma/client");
    const imports_1 = __importDefault(require("./imports"));
    const zod_1 = require("zod");
    const registerSchema = zod_1.z.object({
        username: zod_1.z.string(),
        password: zod_1.z.string()
    });
    const luciaAuth = imports_1.default.then(({ lucia, prisma, github }) => {
        const auth = lucia({
            adapter: prisma(new client_1.PrismaClient()),
            env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
            transformUserData: (userData) => {
                return {
                    userId: userData.id,
                    username: userData.username
                };
            }
        });
        const githubAuth = github(auth, {
            clientId: process.env.GITHUB_CLIENT_ID ?? "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
        });
        return { auth, githubAuth };
    });
    exports.auth = luciaAuth.then((a) => a.auth);
    exports.githubAuth = luciaAuth.then((a) => a.githubAuth);
});
