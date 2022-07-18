export declare const generateRandomString: (length: number) => string;
export declare const hash: (s: string) => Promise<string>;
export declare const compare: (s: string, s_hash: string) => Promise<void>;
export declare const safeCompare: (s: string, s_hash: string) => Promise<boolean>;
