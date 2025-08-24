import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["tests/**/*.test.ts"],
        sequence: {
            concurrent: false,
        },
        setupFiles: ["tests/setup.ts"],
        alias: {
            "@src": path.resolve(process.cwd(), "src"),
        },
    },
});
