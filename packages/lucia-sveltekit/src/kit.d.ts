export interface RequestEvent<
    Params extends Partial<Record<string, string>> = Partial<
        Record<string, string>
    >
> {
    getClientAddress: () => string;
    locals: {};
    params: Params;
    platform: Readonly<{}>;
    request: Request;
    routeId: string | null;
    setHeaders: (headers: ResponseHeaders) => void;
    url: URL;
}

export type MaybePromise<T> = T | Promise<T>;

export type ResponseHeaders = Record<string, string | number | string[] | null>;

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
> extends RequestEvent<Params> {
    parent: () => Promise<ParentData>;
}
