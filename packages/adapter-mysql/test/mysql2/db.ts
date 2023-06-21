import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({
	path: `${resolve()}/.env`
});

export const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	database: process.env.MYSQL2_DATABASE,
	password: process.env.MYSQL2_PASSWORD
});
