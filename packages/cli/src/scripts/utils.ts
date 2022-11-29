import fs from "fs";
import path from "path";
import child_process from "child_process";

export const getPath = (relativePath: string) => {
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
	const dir = relativePath.split("/").slice(0, -1).join("/");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	fs.writeFileSync(getPath(relativePath), data, {
		flag: "w"
	});
};

export const getRelativeFilePath = (fromPath: string, targetPath: string) => {
	console.log(fromPath, targetPath)
	const chunkArray = <Arr extends any[]>(
		arr: Arr,
		position: number
	): [Arr[number][], Arr[number][]] => {
		return [arr.slice(0, position), arr.slice(position)];
	};
	const [fromDir] = chunkArray(fromPath.split("/"), -1).map((val) => val.join("/"));
	return path.relative(fromDir, targetPath);
};
