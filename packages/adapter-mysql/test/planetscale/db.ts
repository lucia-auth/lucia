import dotenv from "dotenv";
import { resolve } from "path";
import { LuciaError } from "lucia-auth";
import { planetscale as planetscaleAdapter } from "../../src/index.js";
import { planetscaleRunner } from "../../src/planetscale/runner.js";
import { createQueryHandler } from "../index.js";
import { connect } from "@planetscale/database";

dotenv.config({
	path: `${resolve()}/.env`
});

const connection = connect({
	host: process.env.PLANETSCALE_HOST,
	username: process.env.PLANETSCALE_USERNAME,
	password: process.env.PLANETSCALE_PASSWORD
});
export const adapter = planetscaleAdapter(connection)(LuciaError);
export const queryHandler = createQueryHandler(planetscaleRunner(connection));
