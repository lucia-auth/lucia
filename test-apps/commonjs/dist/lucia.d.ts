declare const luciaAuth: Promise<{
    auth: import("lucia-auth").Auth<{
        adapter: import("lucia-auth").AdapterFunction<import("lucia-auth").Adapter>;
        env: "DEV" | "PROD";
        transformUserData: (userData: any) => {
            userId: any;
            username: any;
        };
    }>;
    githubAuth: import("@lucia-auth/oauth/github").Github<import("lucia-auth").Auth<{
        adapter: import("lucia-auth").AdapterFunction<import("lucia-auth").Adapter>;
        env: "DEV" | "PROD";
        transformUserData: (userData: any) => {
            userId: any;
            username: any;
        };
    }>>;
}>;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Auth = UnwrapPromise<typeof luciaAuth>["auth"];
export declare const auth: Promise<import("lucia-auth").Auth<{
    adapter: import("lucia-auth").AdapterFunction<import("lucia-auth").Adapter>;
    env: "DEV" | "PROD";
    transformUserData: (userData: any) => {
        userId: any;
        username: any;
    };
}>>;
export declare const githubAuth: Promise<import("@lucia-auth/oauth/github").Github<import("lucia-auth").Auth<{
    adapter: import("lucia-auth").AdapterFunction<import("lucia-auth").Adapter>;
    env: "DEV" | "PROD";
    transformUserData: (userData: any) => {
        userId: any;
        username: any;
    };
}>>>;
export {};
