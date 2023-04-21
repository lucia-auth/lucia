import { default as sqliteAdapter } from "../../src/better-sqlite3/index.js";
import sqlite from "better-sqlite3";
import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { LuciaQueryHandler } from "@lucia-auth/adapter-test";

dotenv.config({
	path: `${resolve()}/.env`
});

const db = sqlite("sqlite/main.db");

export const adapter = sqliteAdapter(db)(LuciaError);

export const queryHandler: LuciaQueryHandler = {
	user: {
		get: async () => {
			let result = db.prepare("SELECT * FROM auth_user").get();
			if (!result) return [];
			if (!Array.isArray(result)) {
				result = [result];
			}
			return result;
		},
		insert: async (user) => {
			const columns = Object.keys(user);
			db.prepare(
				`INSERT INTO auth_user (${columns}) VALUES (${columns.map(() => "?")})`
			).run(...columns.map((column) => user[column]));
		},
		clear: async () => {
			db.exec("DELETE FROM auth_user");
		}
	},
	session: {
		get: async () => {
			let result = db.prepare("SELECT * FROM auth_session").get();
			if (!result) return [];
			if (!Array.isArray(result)) {
				result = [result];
			}
			return result;
		},
		insert: async (session) => {
			const columns = Object.keys(session);
			db.prepare(
				`INSERT INTO auth_session (${columns}) VALUES (${columns.map(
					() => "?"
				)})`
			).run(...columns.map((column) => session[column]));
		},
		clear: async () => {
			console.log(2);
			db.exec("DELETE FROM auth_session;");
		}
	},
	key: {
		get: async () => {
			let result = db.prepare("SELECT * FROM auth_key").get();
			if (!result) return [];
			if (!Array.isArray(result)) {
				result = [result];
			}
			return result;
		},
		insert: async (key) => {
			const columns = Object.keys(key);
			db.prepare(
				`INSERT INTO auth_key (${columns}) VALUES (${columns.map(() => "?")})`
			).run(...columns.map((column) => sanitizeValue(key[column])));
		},
		clear: async () => {
			console.log(3);
			db.exec("DELETE FROM auth_key;");
		}
	}
};

const sanitizeValue = (val: unknown) => {
	if (typeof val === "boolean") return Number(val);
	return val;
};
