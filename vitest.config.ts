import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Máquina compartilhada com agentes/builds em paralelo: folga de tempo
    // evita falsos negativos por contenção de CPU (os testes são rápidos).
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
