// generic needed for inferring type
export class Schema<T> {
	public parse: (input: unknown) => void;
	constructor(parse: (input: unknown) => void) {
		this.parse = parse;
	}
}

class ParseError extends TypeError {
	constructor(targetType: string, input: any) {
		super(`Expected type: ${targetType}; Got ${input}`);
	}
}

export const String$ = () => {
	return new Schema<string>((input: unknown) => {
		if (typeof input !== "string") throw new ParseError("string", input);
	});
};

export const Number$ = () => {
	return new Schema<number>((input: unknown) => {
		if (typeof input !== "number") throw new ParseError("number", input);
	});
};

export const Optional$ = <S extends Schema<any>>(schema: S) => {
	return new Schema<S extends Schema<infer T> ? T | undefined : undefined>(
		(input: unknown) => {
			if (typeof input === "undefined") return;
			schema.parse(input);
		}
	);
};

export type SchemaObject = Record<string, Schema<any> | undefined>;

export const validateObjectSchema = <T extends SchemaObject>(
	schemaObj: T,
	target: Record<string, any>
) => {
	Object.entries(schemaObj).forEach(([key, schema]) => {
		if (!schema) return;
		schema.parse(target[key]);
	});
	return target as ParsedSchema<T>;
};

export type ParsedSchema<T extends SchemaObject> = {
	[K in keyof T]: T[K] extends Schema<infer S> ? S : never;
};
