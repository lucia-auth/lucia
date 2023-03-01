import { auth, githubAuth } from "./lucia";
import express, { type Request, type Response } from "express";
import { z } from "zod";

const registerSchema = z.object({
	username: z.string(),
	password: z.string()
});

const app = express();

app.get("/register", async (req: Request, res: Response) => {
	const data = registerSchema.safeParse(req.body);
	if (!data.success) {
		res.status(400).send("Invalid data");
		return;
	}
	const { username, password } = data.data;

	const user = (await auth).createUser({
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
