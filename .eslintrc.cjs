module.exports = {
	extends: ["prettier"],
	rules: {
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-empty-interface": "off",
		"no-async-promise-executor": "off",
		"no-useless-catch": "off"
	},
	parser: "@typescript-eslint/parser",
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	],
	plugins: ["@typescript-eslint"],
	ignorePatterns: ["*.cjs"]
};
