import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sem `globals: true` no vitest, a Testing Library não registra a limpeza
// automática — sem isto, renders acumulam entre os testes do mesmo arquivo.
afterEach(() => {
  cleanup();
});
