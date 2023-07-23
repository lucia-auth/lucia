export const sendEmailVerificationLink = async (token: string) => {
	const url = `http://localhost:3000/api/email-verification/${token}`;
	console.log(`Your email verification link: ${url}`);
};

export const sendPasswordResetLink = async (token: string) => {
	const url = `http://localhost:3000/password-reset/${token}`;
	console.log(`Your password reset link: ${url}`);
};

export const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== "string") return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};
