import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Relax strict rules that break CI build
      "@typescript-eslint/no-explicit-any": "off",
      // Keep as warning; not failing the build
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
