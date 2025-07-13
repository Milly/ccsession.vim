/**
 * Represents the role of a message sender in a chat conversation.
 */
export type Role = "assistant" | "user";

/**
 * Represents the type of content within a message.
 */
export type MessageContentType =
  | "text"
  | "thinking"
  | "tool_result"
  | "tool_use";

/**
 * Represents a single content item within a message.
 * This can be text, tool use, tool result, or thinking content.
 */
export interface MessageContentItem {
  type: MessageContentType;
  text?: string;
  name?: string;
  content?: string;
  input?: unknown;
  is_error?: boolean;
  tool_use_id?: string;
}

/**
 * Represents message content which can be either a simple string
 * or an array of structured MessageContentItem objects.
 */
export type MessageContent = string | MessageContentItem[];

/**
 * Represents the content of a message with role information.
 * Content can be either a string or an array of MessageContentItem objects.
 */
export interface Message {
  role: Role;
  content?: MessageContent;
}

/**
 * Represents a single message entry in a chat conversation.
 */
export interface SessionMessage {
  sessionId: string;
  timestamp: string;
  type: Role;
  cwd: string;
  message?: Message;
  toolUseResult?: unknown;
}

/**
 * Represents a complete chat conversation session.
 */
export interface Session {
  sessionId: string;
  sessionFilePath: string;
  projectPath: string;
  projectName: string;
  messages: SessionMessage[];
  startTime: Date;
  endTime: Date;
}
