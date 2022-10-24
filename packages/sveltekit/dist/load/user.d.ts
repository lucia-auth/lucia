import type { User } from "lucia-auth";
export declare const getUser: (event: {
    parent: () => Promise<any>;
}) => Promise<Readonly<User> | null>;
