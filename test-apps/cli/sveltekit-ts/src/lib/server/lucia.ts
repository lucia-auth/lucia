import lucia from "lucia-auth";
import mongoose from "@lucia-auth/adapter-mongoose";
import m from "mongoose";
import "./db.js";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: mongoose(m),
	env: dev ? "DEV" : "PROD"
});	

export type Auth = typeof auth