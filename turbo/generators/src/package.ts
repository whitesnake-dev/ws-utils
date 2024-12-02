import { PlopTypes } from "@turbo/gen";

type PackageData = {
    packageType: "common" | "react";
    packageName: string;
    format: "ts" | "tsx"
}

const base = "templates/package";
const templatePath = (name: string): string => `${base}/${name}`;

export default {
    description: "Util package generator",
    prompts: [
      {
        type: "list",
        name: "packageType",
        message: "What type of package should be created?",
        default: "common",
        choices: [
          {
            name: "Common, framework-agnostic package",
            short: "common",
            value: "common",
          },
          {
            name: "React-specific util/hook/etc.",
            short: "react",
            value: "react",
          },
        ],
      },
      {
        type: "input",
        name: "packageName",
        message: "What is the name of the package?",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "package name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "package name cannot include spaces";
          }
          if (!input) {
            return "file name is required";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "format",
        message: "Which format to use?",
        choices: ["ts", "tsx"]
      }
    ],
    actions: function (data: PackageData) {
      const dest = "{{ turbo.paths.root }}/packages/{{ packageType }}/{{ dashCase (lowerCase packageName) }}"
      const actions: PlopTypes.Actions = [
        {
          type: "addMany",
          skipIfExists: true,
          destination: dest,
          base,
          templateFiles: [
              templatePath("tsconfig.json.hbs"),
              templatePath("tsup.config.ts.hbs"),
              templatePath("README.md.hbs"),
              templatePath("vitest.config.ts.hbs"),
              templatePath("eslint.config.js.hbs"),
          ],
        },
      ];
      actions.push({
        type: "add",
        skipIfExists: true,
        path: `${dest}/package.json`,
        templateFile: templatePath(`package.${data.packageType}.json.hbs`)
      })
      actions.push({
        type: "add",
        skipIfExists: true,
        path: `${dest}/src/index.ts`,
        templateFile: templatePath("index.ts.hbs")
      })
      actions.push({
        type: "add",
        skipIfExists: true,
        templateFile: templatePath(`util.${data.format}.hbs`),
        path: `${dest}/src/util.${data.format}`
      })
      return actions
    }
} as PlopTypes.PlopGeneratorConfig;