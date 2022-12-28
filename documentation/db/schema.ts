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
	return new Schema<(typeof schema["typeValue"][0] | undefined)[]>(
		[schema.typeValue[0], undefined],
		(input: any) => {
			if (typeof input === "undefined") return;
			schema.parse(input);
		}
	);
};

export const validateObjectSchema = <SchemaObject extends Record<string, Schema<any>>>(
	schemaObj: SchemaObject,
	target: Record<string, any>
) => {
	Object.entries(schemaObj).forEach(([key, schema]) => {
		schema.parse(target[key]);
	});
	return target as {
		[K in keyof SchemaObject]: SchemaObject[K]["typeValue"][0];
	};
};
