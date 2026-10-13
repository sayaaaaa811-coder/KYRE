import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // "server-only" はクライアントからの誤インポートを防ぐ目印。テストでは空のモジュールに置き換える
    alias: { "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // テストの結果がテスト実行環境のタイムゾーンに左右されないことを確認するため、あえて UTC で実行する
    env: { TZ: "UTC" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/server/**/*.ts", "src/app/api/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
