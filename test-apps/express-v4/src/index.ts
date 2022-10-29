import express from 'express';
import { auth } from './lucia.js';
import { handleMiddleware } from '@lucia-auth/express';

const app = express();
const port = 8080; // default port to listen

app.use(handleMiddleware(auth));
app.get('/', (_, res) => {
	const session = app.locals.getSession();
	res.json(session);
});
app.get('/authenticate', async (_, res) => {
	const user = await auth.getUserByProviderId('username', 'user');
	const session = await auth.createSession(user.userId);
	app.locals.setSession(session);
	res.json({
		user,
		session
	});
});
app.get('/logout', (_, res) => {
	app.locals.clearSession();
	res.send('Success!');
});

app.listen(port, () => {
	console.log(`server started at http://localhost:${port}`);
});
