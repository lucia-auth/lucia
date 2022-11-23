import { initializeCommand } from "./initialize.js";

const handleCommand = async () => {
	const args = process.argv;
	const luciaCommandPosition = args.findIndex((val) =>
		val.endsWith("lucia-auth/dist/cli/scripts/index.js")
	);
	const commandName = args[luciaCommandPosition + 1];

	if (commandName === "init") await initializeCommand();
	process.exit();
};

handleCommand();
