import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

const SUCCESS = { success: true };
const FAILURE = { success: false, error: "Invalid credentials" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("useAuth — signIn", () => {
  test("calls signInAction with email and password", async () => {
    mockSignIn.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
  });

  test("returns result from signInAction", async () => {
    mockSignIn.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    let returnedResult: any;
    await act(async () => {
      returnedResult = await result.current.signIn("user@example.com", "pass");
    });

    expect(returnedResult).toEqual(FAILURE);
  });

  test("sets isLoading to true during execution and false after", async () => {
    let resolveSignIn!: (val: any) => void;
    mockSignIn.mockReturnValue(new Promise((r) => (resolveSignIn = r)));
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "p1" } as any);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn("user@example.com", "pass");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveSignIn(FAILURE);
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signInAction throws", async () => {
    mockSignIn.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn("user@example.com", "pass");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not call handlePostSignIn when sign-in fails", async () => {
    mockSignIn.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "wrong");
    });

    expect(mockGetAnonWorkData).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — signUp", () => {
  test("calls signUpAction with email and password", async () => {
    mockSignUp.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123");
  });

  test("returns result from signUpAction", async () => {
    mockSignUp.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    let returnedResult: any;
    await act(async () => {
      returnedResult = await result.current.signUp("new@example.com", "pass");
    });

    expect(returnedResult).toEqual(FAILURE);
  });

  test("sets isLoading to true during execution and false after", async () => {
    let resolveSignUp!: (val: any) => void;
    mockSignUp.mockReturnValue(new Promise((r) => (resolveSignUp = r)));
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "p1" } as any);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signUp("new@example.com", "pass");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveSignUp(FAILURE);
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signUpAction throws", async () => {
    mockSignUp.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("new@example.com", "pass");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not call handlePostSignIn when sign-up fails", async () => {
    mockSignUp.mockResolvedValue(FAILURE);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "weak");
    });

    expect(mockGetAnonWorkData).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — handlePostSignIn with anonymous work", () => {
  const anonMessages = [{ role: "user", content: "Hello" }];
  const anonFileSystemData = { "/App.jsx": { type: "file", content: "" } };

  beforeEach(() => {
    mockGetAnonWorkData.mockReturnValue({
      messages: anonMessages,
      fileSystemData: anonFileSystemData,
    });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);
  });

  test("creates project with anon work content on signIn success", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith({
      name: expect.stringContaining("Design from"),
      messages: anonMessages,
      data: anonFileSystemData,
    });
  });

  test("clears anon work after creating project on signIn success", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockClearAnonWork).toHaveBeenCalled();
  });

  test("redirects to the new project on signIn success", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
  });

  test("does not call getProjects when anon work exists", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  test("same behavior for signUp success with anon work", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: anonMessages, data: anonFileSystemData })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
  });
});

describe("useAuth — handlePostSignIn, anon work with empty messages", () => {
  test("treats anon work with no messages as no anon work", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([{ id: "existing-project" } as any]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockClearAnonWork).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing-project");
  });
});

describe("useAuth — handlePostSignIn with existing projects", () => {
  test("redirects to most recent project when user has projects", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([
      { id: "recent-project" } as any,
      { id: "older-project" } as any,
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent-project");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  test("same behavior on signUp success with existing projects", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([{ id: "recent-project" } as any]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent-project");
  });
});

describe("useAuth — handlePostSignIn with no existing projects", () => {
  test("creates new project and redirects when user has no projects", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new-project" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
  });

  test("new project name includes 'New Design'", async () => {
    mockSignIn.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "p" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("New Design") })
    );
  });

  test("same behavior on signUp success with no projects", async () => {
    mockSignUp.mockResolvedValue(SUCCESS);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "fresh-project" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/fresh-project");
  });
});
