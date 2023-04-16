import { prismaClient } from "src/db";
import { generateRandomString } from "lucia-auth";
import type { Email as DatabaseEmail } from "@prisma/client";

const sendEmail = async (
	emailAddress: string,
	subject: string,
	content: string
) => {
	await prismaClient.email.create({
		data: {
			id: generateRandomString(8),
			subject,
			email_address: emailAddress,
			content,
			date_sent: new Date()
		}
	});
};

export const sendEmailVerificationEmail = async (
	emailAddress: string,
	verificationToken: string
) => {
	const verificationLink = `http://localhost:3000/email-verification/${verificationToken}`;
	const emailContent = `Please verify your email by clicking the link below:<br/><br/>
<a href="${verificationLink}">${verificationLink}</a>`;
	await sendEmail(emailAddress, "Email verification", emailContent);
};

export const sendPasswordResetEmail = async (
	emailAddress: string,
	resetToken: string
) => {
	const resetLink = `http://localhost:3000/password-reset/${resetToken}`;
	const emailContent = `Please reset your password via the link below:<br/><br/>
    
<a href="${resetLink}">${resetLink}</a>`;
	await sendEmail(emailAddress, "Password reset", emailContent);
};

const transformDatabaseEmail = (databaseEmail: DatabaseEmail) => {
	return {
		emailId: databaseEmail.id,
		toAddress: databaseEmail.email_address,
		dateSent: databaseEmail.date_sent,
		subject: databaseEmail.subject,
		content: databaseEmail.content
	};
};

export const getEmails = async (emailAddressQuery?: string) => {
	const databaseEmails = await prismaClient.email.findMany({
		where: {
			email_address: {
				contains: emailAddressQuery ?? ""
			}
		},
		orderBy: {
			date_sent: "desc"
		}
	});
	return databaseEmails.map((databaseEmail) => {
		return transformDatabaseEmail(databaseEmail);
	});
};

export const getEmail = async (emailId: string) => {
	const databaseEmail = await prismaClient.email.findFirst({
		where: {
			id: emailId
		}
	});
	if (!databaseEmail) return null;
	return transformDatabaseEmail(databaseEmail);
};
