/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("@auth/lucia").Auth;
	type UserAttributes = Omit<import("@prisma/client").AuthUser, "id">;
}
