import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // RTL: ممنوع ml- mr- left- right- في Tailwind (استخدم الخصائص المنطقية)
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/(^|[\\s\"'`:])-?(ml|mr|pl|pr)-[\\w\\[]/]",
          message:
            "استخدم الخصائص المنطقية (ms- me- ps- pe-) بدل ml- mr- pl- pr- لدعم RTL.",
        },
        {
          selector: "Literal[value=/(^|[\\s\"'`:])-?(left|right)-[\\w\\[]/]",
          message: "استخدم start-/end- بدل left-/right- لدعم RTL.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "src/generated/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
