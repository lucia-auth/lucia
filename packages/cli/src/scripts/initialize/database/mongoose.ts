import { confirmPrompt, inputPrompt } from "../../../ui/prompts/index.js";
import { getPath, writeData } from "../../utils/fs.js";
import { defaultDir, FRAMEWORK, FrameworkIntegration } from "../constant.js";

export const initializeMongoose = async (
	framework: FrameworkIntegration<FRAMEWORK> | null,
	isTypescriptProject: boolean
): Promise<[isDbInitialized: boolean, absoluteDbFilePath: string | null]> => {
	const setMongooseSchema = await confirmPrompt(
		`Create db.${isTypescriptProject ? "ts" : "js"} file and set up Mongoose database schema?`
	);
	if (!setMongooseSchema) return [false, null];
	const dbFileLocation = await inputPrompt(
		"Which directory should the file be created?",
		defaultDir[framework?.id ?? "DEFAULT"]
	);
	const dbTemplate = `import m from "mongoose";
${framework?.id === FRAMEWORK.SVELTEKIT ? `import { MONGO_URI } from "$env/static/private";\n` : ""}
m.model(
    "user",
    new m.Schema(
        {
            _id: {
                type: String
            },
            provider_id: {
                type: String,
                unique: true,
                required: true
            },
            hashed_password: String
        },
        { _id: false }
    )
);

m.model(
    "session",
    new m.Schema(
        {
            _id: {
                type: String
            },
            user_id: {
                type: String,
                required: true
            },
            expires: {
                type: Number,
                required: true
            },
            idle_expires: {
                type: Number,
                required: true
               }
        },
        { _id: false }
    )
);

m.connect(${framework?.env ?? "process.env"}MONGO_URI ?? "");`;
	writeData(`./${dbFileLocation}/db.${isTypescriptProject ? "ts" : "js"}`, dbTemplate);
	return [true, getPath(`./${dbFileLocation}`)];
};
