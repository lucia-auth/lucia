import { db } from './db';
import { generateRandomString, isWithinExpiration } from 'lucia/utils';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
	const token = generateRandomString(63);

	// you can optionally invalidate all user tokens
	// so only a single valid token exists per user
	// for high security apps

	await db
		.insertInto('email_verification_token')
		.values({
			id: token,
			expires: new Date().getTime() + EXPIRES_IN,
			user_id: userId
		})
		.executeTakeFirst();
	return token;
};

export const validateEmailVerificationToken = async (token: string) => {
	const storedToken = await db.transaction().execute(async (trx) => {
		const storedToken = await trx
			.selectFrom('email_verification_token')
			.selectAll()
			.where('id', '=', token)
			.executeTakeFirst();
		if (!storedToken) throw new Error('Invalid token');
		await trx
			.deleteFrom('email_verification_token')
			.where('user_id', '=', storedToken.user_id)
			.executeTakeFirst();
		return storedToken;
	});
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error('Expired token');
	}
	return storedToken.user_id;
};

export const generatePasswordResetToken = async (userId: string) => {
	const token = generateRandomString(63);

	// you can optionally invalidate all user tokens
	// so only a single valid token exists per user
	// for high security apps

	await db
		.insertInto('password_reset_token')
		.values({
			id: token,
			expires: new Date().getTime() + EXPIRES_IN,
			user_id: userId
		})
		.executeTakeFirst();
	return token;
};

export const validatePasswordResetToken = async (token: string) => {
	const storedToken = await db.transaction().execute(async (trx) => {
		const storedToken = await trx
			.selectFrom('password_reset_token')
			.selectAll()
			.where('id', '=', token)
			.executeTakeFirst();
		if (!storedToken) throw new Error('Invalid token');
		await trx.deleteFrom('password_reset_token').where('id', '=', token).executeTakeFirst();
		return storedToken;
	});
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error('Expired token');
	}
	return storedToken.user_id;
};

export const isValidPasswordResetToken = async (token: string) => {
	const storedToken = await db
		.selectFrom('password_reset_token')
		.selectAll()
		.where('id', '=', token)
		.executeTakeFirst();
	if (!storedToken) return false;
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		return false;
	}
	return true;
};
