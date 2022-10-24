import clc from "cli-color";

export const test = async (name: string, description: string, func: () => Promise<void>) => {
	console.log(`\n${clc.bold.blue("[Test]")} ${clc.bold(name)} : ${description}`);
	try {
		await func();
		console.log(`${clc.green.bold("[Success]")} ${name}`);
	} catch (e) {
		const error = e as Error;
		console.error(`${clc.red("[Error]")} ${error.message}`);
		console.error(`${clc.bold.red("[Failed]")} ${name}`);
		throw new Error();
	}
};

export const end = () => {
	console.log(`${clc.green.bold("Success!")} Completed all tests`);
	process.exit();
};

const isTrueValidation = (result: boolean, error: string, ...log: any[]) => {
	if (result) return;
	console.log(...log);
	throw new Error(error);
};

export const validate = {
	includesSomeItem: <T extends any>(
		arr: T[],
		validate: (t: T) => boolean,
		error: string,
		...log: any[]
	) => {
		isTrueValidation(arr.some(validate), error, arr, ...log);
	},
	notIncludesSomeItem: <T extends any>(
		arr: T[],
		validate: (t: T) => boolean,
		error: string,
		...log: any[]
	) => {
		isTrueValidation(!arr.some(validate), error, arr, log);
	},
	isTrue: <T>(target: T, error: string, ...log: any[]) => {
		isTrueValidation(Object.is(target, true), error, ...log);
	},
	isFalse: (target: any, error: string, ...log: any[]) => {
		isTrueValidation(Object.is(target, false), error, ...log);
	},
	isNull: (target: any, error: string) => {
		isTrueValidation(Object.is(target, null), error, target);
		return target as null;
	},
	isNotNull: <T>(target: T, error: string) => {
		isTrueValidation(!Object.is(target, null), error, target);
		return target as Exclude<T, null>;
	},
	isEqual: (p1: any, p2: any, error: string) => {
		return isTrueValidation(Object.is(p1, p2), error, p1, p2);
	},
	isNotEqual: (p1: any, p2: any, error: string) => {
		return isTrueValidation(!Object.is(p1, p2), error, p1, p2);
	},
	isNonEmptyString: (target: string, error: string) => {
		return isTrueValidation(!!target && typeof target === "string", error, target);
	}
};
