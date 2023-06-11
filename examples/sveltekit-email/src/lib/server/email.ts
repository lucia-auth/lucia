export const sendEmailVerificationLink = async (verificationToken: string) => {
	const verificationLink = `http://localhost:5173/email-verification/${verificationToken}`;
	console.log(verificationLink);
};

export const sendPasswordResetLink = async (resetToken: string) => {
	const resetLink = `http://localhost:5173/password-reset/${resetToken}`;
	console.log(resetLink);
};
