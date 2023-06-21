type Test = (name: string, fn: () => Promise<void>) => Promise<void>;
type Skip = () => void;

let passedCount = 0;

const test: Test = async (name, fn) => {
	try {
		await fn();
		passedCount += 1;
		console.log(`     \x1B[32m✓ \x1B[0;2m${name}\x1B[0m`);
		await afterEachFn();
	} catch (error) {
		console.log(`     \x1B[31m✗ \x1B[0;2m${name}\x1B[0m`);
		throw error;
	}
};

const skip: Skip = () => {
	console.log(`     \x1B[33m! \x1B[0;2mSkipped tests\x1B[0m`);
};

export const method = async (
	name: string,
	runTests: (test: Test, skip: Skip) => Promise<void>
) => {
	console.log(`\n  \x1B[36m${name}\x1B[0m`);

	await runTests(test, skip);
};

export const start = () => {
	console.log(
		`\n\x1B[38;5;63;1m[start] \x1B[0;2m Running adapter testing module\x1B[0m`
	);
};

export const finish = () => {
	console.log(
		`\n\x1B[32;1m[success] \x1B[0;2m Adapter passed \x1B[3m${passedCount}\x1B[23m tests\x1B[0m\n`
	);
};

let afterEachFn = async () => {};

export const afterEach = (fn: () => Promise<void>) => {
	afterEachFn = fn;
};
