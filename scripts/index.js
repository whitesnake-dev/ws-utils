#!/usr/bin/env node
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import pkg from 'fs-extra';
import process from 'node:process';
import path from 'path';
import {
	getTemplatePath,
	kebabCase,
	kebabToUpperCamelCase,
	writeTemplate,
} from './utils.js';

const { mkdirs, existsSync } = pkg;
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

export const generate = new Command()
	.name('generate')
	.argument('[name]', 'Util name', null)
	.argument('[format]', 'Format name', null)
	.argument('[folder]', 'Folder name', null)
	.action(async (name, format, folder) => {
		if (!name) {
			console.log(chalk.yellow('Util name is required'));
			name = await input({ message: 'Util name >>> ' });
		}
		if (!format) {
			console.log(chalk.yellow('Format name is required'));
			format = await select({
				message: 'Format name >>> ',
				choices: [
					{
						name: 'ts',
						value: 'ts',
						description: 'ts util',
					},
					{
						name: 'tsx',
						value: 'tsx',
						description: 'tsx util',
					},
				],
			});
		}
		if (!folder) {
			console.log(chalk.yellow('Folder name is required'));
			folder = await select({
				message: 'Folder name >>> ',
				choices: [
					{
						name: 'react',
						value: 'react',
						description: 'react folder',
					},
					{
						name: 'global',
						value: 'global',
						description: 'global folder',
					},
				],
			});
		}

		const kebabCaseName = kebabCase(name);
		const componentPath = path.join('packages', folder, kebabCaseName);

		if (existsSync(componentPath)) {
			console.log(chalk.red('Util already exists'));
			process.exit(1);
		}

		await mkdirs(path.join(componentPath));
		const upperCamelCaseName = kebabToUpperCamelCase(kebabCaseName);
		const context = {
			componentSlugName: kebabCaseName,
			componentName: upperCamelCaseName,
			componentFormat: format,
        };
        
		console.log(chalk.yellow('Creating util index file'));
		await writeTemplate(
			getTemplatePath('index.ts'),
			context,
			path.join(componentPath, `index.${format}`)
		);

		console.log(chalk.yellow('Creating package.json'));
		await writeTemplate(
			getTemplatePath('package.json'),
			context,
			path.join(componentPath, 'package.json')
		);

		console.log(chalk.yellow('Creating tsconfig.json'));
		await writeTemplate(
			getTemplatePath('tsconfig.json'),
			context,
			path.join(componentPath, 'tsconfig.json')
		);

		console.log(chalk.yellow('Creating rollup.config.js'));
		await writeTemplate(
			getTemplatePath('rollup.config.js'),
			context,
			path.join(componentPath, 'rollup.config.js')
		);

		console.log(chalk.green(`Component ${kebabCaseName} initialized!`));
	})
	.command('install', 'install all necessary packages');

async function main() {
	const program = new Command()
		.name('wsdev-cli')
		.description('Work with internal development of whitesnake-ui');
	program.addCommand(generate);
	program.parse();
}

main();
