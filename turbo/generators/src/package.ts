import type { Actions, PlopGeneratorConfig } from "node-plop";

type PackageData = {
    packageType: "common" | "react";
    packageName: string;
}

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
    ],
    actions: function (data: PackageData) {
      const dest = "{{ turbo.paths.root }}/packages/{{ packageType }}/{{ dashCase (lowerCase packageName) }}"
      const actions: Actions = [
        {
          type: "addMany",
          skipIfExists: true,
          destination: dest,
          templateFiles: [
            "templates/tsconfig.json.hbs",
            "templates/tsup.config.ts.hbs",
            "templates/README.md.hbs",
            "templates/vitest.config.ts.hbs",
            "templates/eslint.config.js.hbs",
          ],
        },
      ];
      actions.push({
        type: "add",
        skipIfExists: true,
        path: `${dest}/package.json`,
        templateFile: `templates/package.${data.packageType}.json.hbs`
      })
      actions.push({
        type: "add",
        skipIfExists: true,
        path: `${dest}/src/index.ts`,
        templateFile: "templates/index.ts.hbs"
      })
      return actions
    }
} as PlopGeneratorConfig;