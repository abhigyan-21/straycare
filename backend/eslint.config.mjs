import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
            }
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_next$|^next$",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                }
            ],
            "no-undef": "error",
            "no-console": "off"
        }
    }
];
