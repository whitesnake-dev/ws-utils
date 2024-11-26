import fs from 'fs-extra';
import path from 'path';
import { default as Handlebars } from 'handlebars';

/**
 * Make string a kebab-case
 * @param str {string}
 * @returns {string}
 */
export const kebabCase = (str) => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/**
 * Converts string from kebab-case to an UpperCamelCase
 * @param str {string}
 * @returns {string}
 */
export const kebabToUpperCamelCase = (str) => {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

/**
 * Write template to file
 * @param template - Handlebars template path
 * @param data - Template context
 * @param path - Path to generate file
 * @returns {Promise<void>}
 */
export const writeTemplate = async (template, data, path) => {
  const templateContent = fs.readFileSync(template, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);
  const content = compiledTemplate(data);
  await fs.writeFile(path, content);
};

export const getTemplatePath = (templateName) => {
  return path.join('scripts', 'templates', `${templateName}.hbs`);
};