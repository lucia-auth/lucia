import clc from "cli-color";

export const test = async (
	name: string,
	description: string,
	func: () => Promise<void>
) => {
	console.log(
		`\n${clc.bold.blue("[Test]")} ${clc.bold(name)} : ${description}`
	);
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

export const INVALID_INPUT = "INVALID_INPUT";
