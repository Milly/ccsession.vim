import {
  assertEquals,
  assertGreater,
  assertRejects,
  fail,
} from "jsr:@std/assert@^1.0.10";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing@^1.0.9/bdd";
import {
  formatSessionSummary,
  getAllSessions,
  getProjectSessions,
  readSessionFile,
} from "./session.ts";
import type { Session, SessionMessage } from "./types.ts";
import { NoMessageError, SessionReadError } from "./errors.ts";

describe(getAllSessions.name, () => {
  it("should yield sessions from all projects", async () => {
    // Test with real data
    const sessions = await Array.fromAsync(getAllSessions());
    assertGreater(sessions.length, 0, "No sessions found");
  });
});

describe(getProjectSessions.name, () => {
  let allSessions: Session[] = [];

  beforeAll(async () => {
    // Test with real data
    try {
      // Get all sessions once before tests
      allSessions = await Array.fromAsync(getAllSessions());
    } catch (e) {
      throw e;
      // If no sessions exist, skip tests
    }
  });

  it("should get sessions for a specific project", async () => {
    if (allSessions.length === 0) {
      fail("No sessions available to test with");
    }

    const firstProjectPath = allSessions[0].projectPath;

    const projectSessions = await Array.fromAsync(
      getProjectSessions([firstProjectPath]),
    );

    assertEquals(Array.isArray(projectSessions), true);

    // All sessions should be from the same project
    for (const session of projectSessions) {
      assertEquals(session.projectPath, firstProjectPath);
    }
  });

  it("should return empty iterable for non-existent project", async () => {
    const nonExistentPath = "/non/existent/project/path";

    const projectSessions = await Array.fromAsync(
      getProjectSessions([nonExistentPath]),
    );

    assertEquals(projectSessions, []);
  });

  it("should return empty iterable for empty array", async () => {
    const projectSessions = await Array.fromAsync(
      getProjectSessions([]),
    );

    assertEquals(projectSessions, []);
  });
});

describe(readSessionFile.name, () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await Deno.makeTempDir({ prefix: "ddu-source-ccsession-test" });
  });

  afterAll(async () => {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  });

  async function createTestFile(
    filename: string,
    content: string,
  ): Promise<string> {
    const filePath = `${testDir}/${filename}`;
    await Deno.writeTextFile(filePath, content);
    return filePath;
  }

  it("should read a valid session file", async () => {
    const messages: SessionMessage[] = [
      {
        type: "user",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:00.000Z",
        cwd: "/test/project",
        message: {
          role: "user",
          content: "First user message",
        },
      },
      {
        type: "assistant",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:10.000Z",
        cwd: "/test/project",
        message: {
          role: "assistant",
          content: "Assistant response",
        },
      },
      {
        type: "user",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:20.000Z",
        cwd: "/test/project",
        message: {
          role: "assistant",
          content: "Last user message",
        },
      },
    ];

    const content = messages.map((m) => JSON.stringify(m)).join("\n");
    const filePath = await createTestFile("valid-session.jsonl", content);

    const session = await readSessionFile(filePath);
    assertEquals(session.sessionId, "test-session");
    assertEquals(session.projectPath, "/test/project");
    assertEquals(session.projectName, "project");
    assertEquals(session.messages.length, 3);
    assertEquals(session.startTime.toISOString(), "2024-01-01T00:00:00.000Z");
    assertEquals(session.endTime.toISOString(), "2024-01-01T00:00:20.000Z");
  });

  it("should throw NoMessageError for empty file", async () => {
    const filePath = await createTestFile("empty-session.jsonl", "");

    await assertRejects(
      async () => await readSessionFile(filePath),
      NoMessageError,
      filePath,
    );
  });

  it("should throw NoMessageError for file with only whitespace", async () => {
    const filePath = await createTestFile(
      "whitespace-session.jsonl",
      "\n\n  \n\n",
    );

    await assertRejects(
      async () => await readSessionFile(filePath),
      NoMessageError,
      filePath,
    );
  });

  it("should throw SessionReadError for non-existent file", async () => {
    const filePath = `${testDir}/non-existent.jsonl`;

    await assertRejects(
      async () => await readSessionFile(filePath),
      SessionReadError,
      filePath,
    );
  });

  it("should throw SessionReadError for invalid JSON", async () => {
    const filePath = await createTestFile(
      "invalid-json.jsonl",
      "{ invalid json }",
    );

    await assertRejects(
      async () => await readSessionFile(filePath),
      SessionReadError,
      filePath,
    );
  });

  it("should skip invalid message objects and continue", async () => {
    const content = [
      JSON.stringify({
        type: "user",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:00.000Z",
        cwd: "/test/project",
        message: {
          role: "user",
          content: "Valid message",
        },
      }),
      '{"invalid": "object"}',
      JSON.stringify({
        type: "user",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:10.000Z",
        cwd: "/test/project",
        message: {
          role: "user",
          content: "Another valid message",
        },
      }),
    ].join("\n");

    const filePath = await createTestFile("mixed-valid-invalid.jsonl", content);

    const session = await readSessionFile(filePath);
    assertEquals(session.messages.length, 2);
  });

  it("should handle messages with only assistant messages", async () => {
    const messages: SessionMessage[] = [
      {
        type: "assistant",
        sessionId: "test-session",
        timestamp: "2024-01-01T00:00:00.000Z",
        cwd: "/test/project",
        message: {
          role: "assistant",
          content: "Assistant only message",
        },
      },
    ];

    const content = messages.map((m) => JSON.stringify(m)).join("\n");
    const filePath = await createTestFile("assistant-only.jsonl", content);

    const session = await readSessionFile(filePath);
    assertEquals(session.messages.length, 1);
  });
});

describe(formatSessionSummary.name, () => {
  it("should format session summary correctly", () => {
    const mockSession: Session = {
      sessionId: "test-session",
      sessionFilePath:
        "/home/user/.claude/projects/-test-project/test-session.jsonl",
      projectPath: "/test/project",
      projectName: "project",
      messages: [
        {
          type: "user",
          sessionId: "test-session",
          timestamp: "2024-01-01T00:00:00.000Z",
          cwd: "/test/project",
          message: {
            role: "user",
            content: "  This   is   a   test   message  ",
          },
        },
      ],
      startTime: new Date(),
      endTime: new Date(),
    };

    const summary = formatSessionSummary(mockSession);
    assertEquals(summary, "This is a test message");
  });

  it("should return empty string when no user messages", () => {
    const mockSession: Session = {
      sessionId: "test-session",
      sessionFilePath:
        "/home/user/.claude/projects/-test-project/test-session.jsonl",
      projectPath: "/test/project",
      projectName: "project",
      messages: [
        {
          type: "assistant",
          sessionId: "test-session",
          timestamp: "2024-01-01T00:00:00.000Z",
          cwd: "/test/project",
          message: {
            role: "assistant",
            content: "Assistant message",
          },
        },
      ],
      startTime: new Date(),
      endTime: new Date(),
    };

    const summary = formatSessionSummary(mockSession);
    assertEquals(summary, "");
  });
});
