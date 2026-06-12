import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  // Fichiers .ts (src/lib, routes .ts, content.config) : règles TS recommandées.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),
  ...eslintPluginAstro.configs.recommended,
  // Parser TS pour le frontmatter et les <script> des .astro.
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  { ignores: ["dist/", ".astro/", "node_modules/"] },
];
