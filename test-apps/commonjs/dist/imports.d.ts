declare const _default: Promise<{
    lucia: <C extends import("lucia-auth").Configurations>(configs: C) => import("lucia-auth").Auth<C>;
    prisma: (prismaClient: import("@lucia-auth/adapter-prisma/prisma").PrismaClient<{
        user: import("lucia-auth").UserSchema;
        session: import("lucia-auth").SessionSchema;
        key: import("lucia-auth").KeySchema;
    }>) => import("lucia-auth").AdapterFunction<import("lucia-auth").Adapter>;
    github: <A extends import("lucia-auth").Auth<any>>(auth: A, configs: import("@lucia-auth/oauth/github").Configs) => import("@lucia-auth/oauth/github").Github<A>;
}>;
export default _default;
