import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

// Downgrade all jsx-a11y recommended rules to warn.
// TODO(phase 6): promote to error once a11y sweep is done.
const a11yRecommendedRules = Object.fromEntries(
  Object.keys(jsxA11yPlugin.flatConfigs.recommended.rules).map((key) => [
    key,
    "warn",
  ])
);

export default [
  // Global ignores
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "tmp/**",
      ".vite/**",
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // Source files — browser context
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,

      // React Hooks core rules
      ...reactHooksPlugin.configs.flat.recommended.rules,

      // Accessibility rules — downgraded to warn; TODO(phase 6): promote to error
      ...a11yRecommendedRules,

      // React 17+ JSX transform — no React import needed
      "react/react-in-jsx-scope": "off",

      // JSDoc-based typing — we use @typedef, not PropTypes
      "react/prop-types": "off",

      // Hard error: hooks called conditionally or inside loops are always bugs
      "react-hooks/rules-of-hooks": "error",

      // TODO(phase 3): promote exhaustive-deps to error
      "react-hooks/exhaustive-deps": "warn",

      // New react-hooks v7 strict rules — downgrade to warn for phase 1
      // These fire on R3F mutation patterns and state-in-effect that are
      // intentional in our codebase; TODO(phase 3): audit and tighten
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",

      // R3F uses many custom JSX attributes (geometry, material, args, etc.)
      // that the standard React plugin doesn't know about.
      // TODO(phase 5): configure ignore list; downgraded to warn for phase 1
      "react/no-unknown-property": "warn",

      // Downgraded from recommended "error" so component-level findings
      // are visible without blocking the gate in phase 1.
      // TODO(phase 2): fix flagged instances and restore to error
      "no-unused-vars": "warn",
      "no-shadow-restricted-names": "warn",
    },
  },

  // Scripts / config files — Node context
  {
    files: ["scripts/**/*.{js,mjs}", "*.config.js", "*.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },

  // Test files — add vitest globals on top of browser context
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },

  // Prettier LAST — disables conflicting formatting rules
  eslintConfigPrettier,
];
