import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/next-env.d.ts",
      ".next/**",
      "out/**",
      "build/**",
    ],
    rules: {
      // Avoid CI/deploy noise for content strings
      "react/no-unescaped-entities": "off",
      // Allow warnings for React hooks exhaustive deps (can be fixed later)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
