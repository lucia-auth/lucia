// installing and importing modules from @sveltejs/kit caused TS errors

export interface Cookies {
    get(
        name: string,
        opts?: import("cookie").CookieParseOptions
    ): string | void;
    set(
        name: string,
        value: string,
        opts?: import("cookie").CookieSerializeOptions
    ): void;
    delete(name: string): void;
}

export interface RequestEvent {
    cookies: Cookies;
    locals: App.Locals
    request: Request;
    url: URL;
}

export type MaybePromise<T> = T | Promise<T>;

export interface ResolveOptions {
    transformPageChunk?: (input: {
        html: string;
        done: boolean;
    }) => MaybePromise<string | undefined>;
}

export interface Handle {
    (input: {
        event: RequestEvent;
        resolve(
            event: RequestEvent,
            opts?: ResolveOptions
        ): MaybePromise<Response>;
    }): MaybePromise<Response>;
}
export interface ServerLoad<
    ParentData extends Record<string, any> = Record<string, any>,
> {
    (event: ServerLoadEvent<ParentData>): MaybePromise<Record<string, any> | void>;
}

export interface ServerLoadEvent<
    ParentData extends Record<string, any> = Record<string, any>
> extends RequestEvent {
    parent: () => Promise<ParentData>;
}

export interface LoadEvent<
    ParentData extends Record<string, unknown> = Record<string, any>
> extends NavigationEvent {
    parent: () => Promise<ParentData>;
}

export interface NavigationEvent {
    params: Record<string, string>;
    routeId: string | null;
    url: URL;
}
