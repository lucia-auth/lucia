// installing and importing modules from @sveltejs/kit caused TS errors

import type { Session } from "./types";

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

export interface RequestEvent<
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >,
    Locals extends {} = {}
> {
    cookies: Cookies;
    getClientAddress: () => string;
    locals: App.Locals & Locals; // we don't set { _lucia: Session } here since it's _lucia is not set in handle/hooks
    params: Params;
    platform: Readonly<{}>;
    request: Request;
    routeId: string | null;
    setHeaders: (headers: Record<string, string>) => void;
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
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >,
    ParentData extends Record<string, any> = Record<string, any>,
    OutputData extends Record<string, any> | void = Record<string, any> | void
> {
    (event: ServerLoadEvent<Params, ParentData>): MaybePromise<OutputData>;
}

export interface ServerLoadEvent<
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >,
    ParentData extends Record<string, any> = Record<string, any>
> extends RequestEvent<Params, { _lucia: Session }> {
    parent: () => Promise<ParentData>;
}

export interface LoadEvent<
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >,
    Data extends Record<string, unknown> | null = Record<string, any> | null,
    ParentData extends Record<string, unknown> = Record<string, any>
> extends NavigationEvent<Params> {
    fetch(info: RequestInfo, init?: RequestInit): Promise<Response>;
    data: Data;
    setHeaders: (headers: Record<string, string>) => void;
    parent: () => Promise<ParentData>;
    depends: (...deps: string[]) => void;
}

export interface NavigationEvent<
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >
> {
    params: Params;
    routeId: string | null;
    url: URL;
}
