# Whitesnake Utils

Bunch of random JS utils widely used in Whitesnake


## What's inside?

This repo includes the following packages:

### Apps and Packages

Public, pushed to NPM
- `packages/common/*`: framework-agnostic utils
- `packages/react/*`: React ecosystem utils and common hooks

Private
- `typescript-config`: `tsconfig.json` files used throughout the repo
- `eslint-config`: `eslint.config.js` files used throughout the repo
- `turbo/`: `turbo` related packages (generators)

### Development

1. To start development in that repo just clone and install dependencies via pnpm
```shell
cd ws-utils
pnpm i
```
Create new branch that will contain pending changes

2. To bootstrap new utility, run turbo gen:
```shell
turbo gen package  # starts package generation wizard
```

3. Update `tsup.config.ts` and `package.json` and other files accordingly for your needs if needed
4. bim bim bam bam
5. Provide meaningful `README.md` for details about your package.


### Publishing and versioning

First, read changeset official [intro](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)

1. When you ready to produce new version, run changeset in root of your feature/fix/whatever branch 
```shell
pnpm changeset
```
Choose which packages and how you want to bump versions. 
When you're done, changeset will commit new change manifest into `.changeset/` folder, which can be additionally edited

2. Open a PR into `main` branch and wait for code review and CI to be finished and accepted
3. Merge a PR into `main` branch, that will trigger publishing automatically

