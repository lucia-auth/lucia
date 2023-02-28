"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubAuth = exports.auth = void 0;
const lucia_auth_1 = __importDefault(require("lucia-auth"));
const adapter_prisma_1 = __importDefault(require("@lucia-auth/adapter-prisma"));
const client_1 = require("@prisma/client");
const github_1 = __importDefault(require("@lucia-auth/oauth/github"));
exports.auth = (0, lucia_auth_1.default)({
    adapter: (0, adapter_prisma_1.default)(new client_1.PrismaClient()),
    env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
    transformUserData: (userData) => {
        return {
            userId: userData.id,
            username: userData.username
        };
    }
});
exports.githubAuth = (0, github_1.default)(exports.auth, {
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});
