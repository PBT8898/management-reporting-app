import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";
import { dirname } from "node:path";
const require = createRequire(import.meta.url);
const compat = new FlatCompat({ baseDirectory: process.cwd(), resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")) });
export default [{ ignores: [".next/**", "node_modules/**", "next-env.d.ts"] }, ...compat.extends("next/core-web-vitals", "next/typescript")];
