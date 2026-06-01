import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  ...eslintPluginAstro.configs.recommended,
  // Parser TS pour le frontmatter et les <script> des .astro.
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: { parser: tsParser },
    },
  },
  { ignores: ["dist/", ".astro/", "node_modules/"] },
];
