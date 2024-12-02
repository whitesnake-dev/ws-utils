# Whitesnake Utils

Bunch of random JS utils widely used in Whitesnake


## What's inside?

This repo includes the following packages:

### Apps and Packages

- `common/*`: framework-agnostic utils
- `react/*`: React ecosystem utils and common hooks
- `typescript-config`: `tsconfig.json` files used throughout the repo
- `eslint-config`: `eslint.config.js` files used throughout the repo


### Development

1. To start development in that repo just clone and install dependencies via pnpm

```shell
cd ws-utils
pnpm i
```

2. To bootstrap new utility, run turbo gen:
```shell
turbo gen package  # starts package generation wizard
```

3. Update `tsup.config.ts` and `package.json` and other files accordingly for your needs if needed
4. bim bim bam bam
5. Provide meaningful `README.md` for details about your package.
