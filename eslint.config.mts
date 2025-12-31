import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"env.d.ts",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"svelte.config.js",
	]),
	{
		plugins: {
			obsidianmd: obsidianmd,
		},
		rules: {
			"import/no-nodejs-modules": "off",
			"obsidianmd/ui/sentence-case": [
				"warn",
				{
					acronyms: ["ID", "GOXXXX", "XXXX"],
					brands: ["Google", "Google Calendar", "Google Cloud", "OAuth", "Obsidian"],
					ignoreWords: ["e.g.,"],
				},
			],
		},
	}
);
