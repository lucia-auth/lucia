import fs from "fs";
import path from "path";
import child_process from "child_process";

const getPath = (relativePath: string) => {
	return path.resolve(process.cwd(), relativePath);
};

export const fileExists = (relativePath: string) => {
	return fs.existsSync(getPath(relativePath));
};

export const runCommand = (command: string) => {
	return new Promise<void>((resolve) => {
		child_process.exec(command, () => resolve());
	});
};

export const appendData = (relativePath: string, data: string) => {
	fs.appendFileSync(getPath(relativePath), data);
};

export const writeData = (relativePath: string, data: string) => {
	fs.writeFileSync(getPath(relativePath), data);
};
