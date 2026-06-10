import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/components/Button.jsx" })).toBe("Creating Button.jsx");
});

test("getToolLabel: str_replace_editor str_replace with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor insert with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: str_replace_editor view with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.jsx" })).toBe("Reading index.jsx");
});

test("getToolLabel: str_replace_editor undo_edit with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Reverting App.jsx");
});

test("getToolLabel: str_replace_editor unknown command with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" })).toBe("Working on App.jsx");
});

test("getToolLabel: str_replace_editor no path falls back gracefully", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
  expect(getToolLabel("str_replace_editor", { command: "str_replace" })).toBe("Editing file");
  expect(getToolLabel("str_replace_editor", {})).toBe("Editing file");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old/Button.jsx" })).toBe("Renaming Button.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/components/Card.tsx" })).toBe("Deleting Card.tsx");
});

test("getToolLabel: file_manager no path falls back gracefully", () => {
  expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
  expect(getToolLabel("file_manager", {})).toBe("Managing files");
});

test("getToolLabel: unknown tool returns toolName as-is", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// --- ToolCallBadge rendering tests ---

test("ToolCallBadge renders friendly label for create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/components/Button.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.jsx")).toBeDefined();
});

test("ToolCallBadge renders friendly label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/App.tsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("ToolCallBadge shows spinner when state is call", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  // Spinner uses animate-spin class
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge shows green dot when state is result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge renders file_manager delete label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/components/OldCard.tsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Deleting OldCard.tsx")).toBeDefined();
});

test("ToolCallBadge renders file_manager rename label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/components/Card.tsx", new_path: "/components/ProductCard.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Card.tsx")).toBeDefined();
});
