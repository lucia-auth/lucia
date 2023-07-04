import { connect } from "@planetscale/database";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({
	path: `${resolve()}/.env`
});

export const connection = connect({
	host: process.env.PLANETSCALE_HOST,
	username: process.env.PLANETSCALE_USERNAME,
	password: process.env.PLANETSCALE_PASSWORD
});
