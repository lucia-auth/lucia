export class Schema<T extends any[]> {
	public parse: (input: any) => void;
	public typeValue: T;
	constructor(typeValue: T, parse: (input: any) => void) {
		this.typeValue = typeValue;
		this.parse = parse;
	}
}

class ParseError extends TypeError {
	constructor(targetType: string, input: any) {
		super(`Expected type: ${targetType}; Got ${input}`);
	}
}

export const String$ = () => {
	return new Schema<string[]>([""], (input: any) => {
		if (typeof input !== "string") throw new ParseError("string", input);
	});
};

export const Number$ = () => {
	return new Schema<number[]>([0], (input: any) => {
		if (typeof input !== "number") throw new ParseError("number", input);
	});
};

export const Optional$ = <S extends Schema<any[]>>(schema: S) => {
	return new Schema<((typeof schema)["typeValue"][number] | undefined)[]>(
		[schema.typeValue[0], undefined],
		(input: any) => {
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
	[K in keyof T]: T[K] extends Schema<any> ? T[K]["typeValue"][0] : never;
};
