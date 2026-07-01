const CODEBASES = [
	'admin',
	'user',
	'company',
	'company-user',
	'task',
	'kanban',
];

module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'google',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: [
			'packages/functions-shared/tsconfig.json',
			...CODEBASES.map((name) => `functions-${name}/tsconfig.json`),
		],
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	ignorePatterns: [
		'**/lib/**/*',
		'**/vendor/**/*',
		'**/node_modules/**/*',
		'scripts/**/*',
		'prettier.config.js',
		'.eslintrc.js',
	],
	plugins: ['@typescript-eslint', 'import'],
	rules: {
		quotes: 'off',
		'@typescript-eslint/quotes': ['error', 'double'],
		indent: 'off',
		'@typescript-eslint/indent': ['error', 2],
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'require-jsdoc': 'off',
		'import/no-unresolved': 0,
	},
};
