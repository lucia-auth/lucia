var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var __syncRequire = typeof module === "object" && typeof module.exports === "object";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Promise.all([
        __syncRequire ? Promise.resolve().then(() => __importStar(require("lucia-auth"))) : new Promise((resolve_1, reject_1) => { require(["lucia-auth"], resolve_1, reject_1); }).then(__importStar),
        __syncRequire ? Promise.resolve().then(() => __importStar(require("@lucia-auth/adapter-prisma"))) : new Promise((resolve_2, reject_2) => { require(["@lucia-auth/adapter-prisma"], resolve_2, reject_2); }).then(__importStar),
        __syncRequire ? Promise.resolve().then(() => __importStar(require("@lucia-auth/oauth/github"))) : new Promise((resolve_3, reject_3) => { require(["@lucia-auth/oauth/github"], resolve_3, reject_3); }).then(__importStar)
    ]).then(([lucia, prisma, github]) => {
        return {
            lucia: lucia.default,
            prisma: prisma.default,
            github: github.default
        };
    });
});
