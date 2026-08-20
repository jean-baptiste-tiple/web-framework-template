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
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      // Script Workflow (DSL Claude Code) : le runtime enveloppe le corps dans une
      // fonction (return top-level, globals phase/agent/pipeline) → non parsable
      // comme module standard. Ignore ciblé, le reste de scripts/ est linté.
      "scripts/parity/vision.workflow.js",
    ],
  },
];
