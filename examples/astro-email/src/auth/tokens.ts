import { prismaClient } from "src/db";
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string) => {
	const storedUserTokens = await prismaClient.emailVerificationToken.findMany({
		where: {
			user_id: userId
		}
	});
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(
				Number(token.expires) - EMAIL_VERIFICATION_TOKEN_EXPIRES_IN / 2
			);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(64);
	await prismaClient.emailVerificationToken.create({
		data: {
			id: token,
			expires: new Date().getTime() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN,
			user_id: userId
		}
	});
	return token;
};

export const validateEmailVerificationToken = async (token: string) => {
	const storedToken = await prismaClient.emailVerificationToken.findUnique({
		where: {
			id: token
		}
	});
	if (!storedToken) return null;
	const tokenExpires = Number(storedToken.expires);
	if (!isWithinExpiration(tokenExpires)) return null;
	// we can invalidate all tokens since a user only verifies their email once
	await prismaClient.emailVerificationToken.deleteMany({
		where: {
			user_id: storedToken.user_id
		}
	});
	return storedToken.user_id;
};

const PASSWORD_RESET_TOKEN_EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	const storedUserTokens = await prismaClient.passwordResetToken.findMany({
		where: {
			user_id: userId
		}
	});
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(
				Number(token.expires) - PASSWORD_RESET_TOKEN_EXPIRES_IN / 2
			);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(128);
	await prismaClient.passwordResetToken.create({
		data: {
			id: token,
			expires: new Date().getTime() + PASSWORD_RESET_TOKEN_EXPIRES_IN,
			user_id: userId
		}
	});
	return token;
};

export const validatePasswordResetToken = async (token: string) => {
	const storedToken = await prismaClient.passwordResetToken.findUnique({
		where: {
			id: token
		}
	});
	if (!storedToken) return null;
	const tokenExpires = Number(storedToken.expires);
	if (!isWithinExpiration(tokenExpires)) return null;
	// invalidate all user password reset tokens
	await prismaClient.passwordResetToken.deleteMany({
		where: {
			user_id: storedToken.user_id
		}
	});
	return storedToken.user_id;
};

export const isValidPasswordResetToken = async (token: string) => {
	const storedToken = await prismaClient.passwordResetToken.findUnique({
		where: {
			id: token
		}
	});
	if (!storedToken) return false;
	const tokenExpires = Number(storedToken.expires);
	if (!isWithinExpiration(tokenExpires)) return false;
	return true;
};
