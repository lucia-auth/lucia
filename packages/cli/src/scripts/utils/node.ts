import child_process from "child_process";

export const runCommand = (command: string) => {
	return new Promise<void>((resolve) => {
		child_process.exec(command, () => resolve());
	});
};