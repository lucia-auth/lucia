import fs from "fs";
import path from "path";

export const getPath = (relativePath: string) => {
	return path.resolve(process.cwd(), relativePath);
};

export const fileExists = (relativePath: string) => {
	return fs.existsSync(getPath(relativePath));
};

export const writeData = (relativePath: string, data: string) => {
	const dir = relativePath.split("/").slice(0, -1).join("/");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(getPath(relativePath), data, {
		flag: "w"
	});
};

export const appendData = (relativePath: string, data: string) => {
	const dir = relativePath.split("/").slice(0, -1).join("/");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.appendFileSync(getPath(relativePath), data);
};

export const getRelativeFilePath = (fromPath: string, targetPath: string) => {
	const chunkArray = <Arr extends any[]>(
		arr: Arr,
		position: number
	): [Arr[number][], Arr[number][]] => {
		return [arr.slice(0, position), arr.slice(position)];
	};
	const [fromDir] = chunkArray(fromPath.split("/"), -1).map((val) => val.join("/"));
	const relativeDirPath = path.relative(fromDir, targetPath);
	return `${relativeDirPath.startsWith(".") ? "" : "./"}${relativeDirPath}`;
};
