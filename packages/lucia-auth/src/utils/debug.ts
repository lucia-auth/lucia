const DEBUG_GLOBAL = "__lucia_debug_mode";

const ESCAPE = "\x1B";
const DEFAULT_TEXT_FORMAT = "\x1B[0m";
const DEFAULT_FG_BG = `${ESCAPE}[0m`;
const RED_CODE = 9;
const LUCIA_COLOR_CODE = 63;
const WHITE_CODE = 231;
const GREEN_CODE = 34;
const CYAN_CODE = 6;
const YELLOW_CODE = 3;
const PURPLE_CODE = 5;
const BLUE_CODE = 4;

const globalContext = globalThis as {
	__lucia_debug_mode?: boolean;
};

const format = (text: string, format: string, removeFormat?: string) => {
	return `${format}${text}${removeFormat ? removeFormat : DEFAULT_TEXT_FORMAT}`;
};

const bgFormat = (text: string, colorCode: number) => {
	return format(text, `${ESCAPE}[48;5;${colorCode}m`, DEFAULT_FG_BG);
};

const fgFormat = (text: string, colorCode: number) => {
	return format(text, `${ESCAPE}[38;5;${colorCode}m`, DEFAULT_FG_BG);
};

export const bg = {
	lucia: (text: string) => bgFormat(text, LUCIA_COLOR_CODE),
	red: (text: string) => bgFormat(text, RED_CODE),
	white: (text: string) => bgFormat(text, WHITE_CODE),
	green: (text: string) => bgFormat(text, GREEN_CODE),
	cyan: (text: string) => bgFormat(text, CYAN_CODE),
	yellow: (text: string) => bgFormat(text, YELLOW_CODE),
	purple: (text: string) => bgFormat(text, PURPLE_CODE),
	blue: (text: string) => bgFormat(text, BLUE_CODE)
} as const;

export const fg = {
	lucia: (text: string) => fgFormat(text, LUCIA_COLOR_CODE),
	red: (text: string) => fgFormat(text, RED_CODE),
	white: (text: string) => fgFormat(text, WHITE_CODE),
	green: (text: string) => fgFormat(text, GREEN_CODE),
	cyan: (text: string) => fgFormat(text, CYAN_CODE),
	yellow: (text: string) => fgFormat(text, YELLOW_CODE),
	purple: (text: string) => fgFormat(text, PURPLE_CODE),
	blue: (text: string) => fgFormat(text, BLUE_CODE),
	default: (text: string) => format(text, DEFAULT_TEXT_FORMAT)
} as const;

export const bold = (text: string) =>
	format(text, `${ESCAPE}[1m`, `${ESCAPE}[22m`);

const dim = (text: string) => format(text, `${ESCAPE}[2m`, `${ESCAPE}[22m`);

const isDebugModeEnabled = () => {
	return Boolean(globalContext[DEBUG_GLOBAL]);
};

const linebreak = () => console.log("");

const createCategory = (name: string, themeTextColor: TextColor) => {
	const createLogger = (textColor: TextColor = fg.default) => {
		return (text: string, subtext?: string) => {
			if (!isDebugModeEnabled()) return;
			if (subtext) {
				return log(themeTextColor(`[${name}]`), `${textColor(text)}`, subtext);
			}
			log(themeTextColor(`[${name}]`), `${textColor(text)}`);
		};
	};
	return {
		info: createLogger(),
		notice: createLogger(fg.yellow),
		fail: createLogger(fg.red),
		success: createLogger(fg.green)
	};
};

export const enableDebugMode = () => {
	globalContext[DEBUG_GLOBAL] = true;
};

const disableDebugMode = () => {
	globalContext[DEBUG_GLOBAL] = false;
};

export const debug = {
	init: (debugEnabled: boolean) => {
		if (debugEnabled) {
			enableDebugMode();
			linebreak();
			console.log(
				` ${bg.lucia(bold(fg.white(" lucia ")))}  ${fg.lucia(
					bold("Debug mode enabled")
				)}`
			);
		} else {
			disableDebugMode();
		}
	},
	request: {
		init: (method: string, href: string) => {
			if (!isDebugModeEnabled()) return;
			linebreak();
			const getUrl = () => {
				try {
					const url = new URL(href);
					return url.origin + url.pathname;
				} catch {
					return href;
				}
			};
			log(
				bg.cyan(bold(fg.white(" request "))),
				fg.cyan(`${method.toUpperCase()} ${getUrl()}`)
			);
		},
		...createCategory("request", fg.cyan)
	},
	session: createCategory("session", fg.purple),
	key: createCategory("key", fg.blue)
} as const;

type TextColor = (typeof fg)[keyof typeof fg];

const log = (type: string, text: string, subtext?: string) => {
	if (!subtext) {
		return console.log(
			`${dim(new Date().toLocaleTimeString())}  ${type} ${text}`
		);
	}
	console.log(
		`${dim(new Date().toLocaleTimeString())}  ${type} ${text} ${dim(subtext)}`
	);
};
