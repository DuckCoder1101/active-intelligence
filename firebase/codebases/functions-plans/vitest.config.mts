import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "functions-shared": path.resolve(
        import.meta.dirname,
        "tests/mocks/functions-shared.ts",
      ),
    },
  },
});
