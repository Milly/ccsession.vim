import { as, is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";

import { truncateText } from "../util/text.ts";
import type {
  Message,
  MessageContent,
  MessageContentItem,
  MessageContentType,
  Role,
  SessionMessage,
} from "./types.ts";

export const isRole = is.LiteralOneOf(
  ["user", "assistant"] as const,
) satisfies Predicate<Role>;

export const isMessageContentType = is.LiteralOneOf(
  [
    "text",
    "tool_use",
    "tool_result",
    "thinking",
  ] as const,
) satisfies Predicate<MessageContentType>;

export const isMessageContentItem = is.ObjectOf({
  type: isMessageContentType,
  text: as.Optional(is.String),
  content: as.Optional(is.String),
  name: as.Optional(is.String),
  input: as.Optional(is.Unknown),
  is_error: as.Optional(is.Boolean),
  tool_use_id: as.Optional(is.String),
}) satisfies Predicate<MessageContentItem>;

export const isMessageContent = is.UnionOf([
  is.String,
  is.ArrayOf(isMessageContentItem),
]) satisfies Predicate<MessageContent>;

export const isMessage = is.ObjectOf({
  role: isRole,
  content: as.Optional(isMessageContent),
}) satisfies Predicate<Message>;

export const isSessionMessage = is.ObjectOf({
  sessionId: is.String,
  timestamp: is.String,
  type: isRole,
  cwd: is.String,
  message: as.Optional(isMessage),
  toolUseResult: as.Optional(is.Unknown),
}) satisfies Predicate<SessionMessage>;

export function extractMessageText(content: MessageContent): string {
  if (is.String(content)) {
    return truncateText(content);
  }

  const parts: string[] = [];

  for (const item of content) {
    if (!item) continue;

    if (item.type === "text" && item.text) {
      parts.push(item.text);
    } else if (item.type === "tool_use" && item.name) {
      // Format tool use messages
      const { name, input } = item;
      let description = "";

      if (is.Record(input)) {
        if (is.String(input.command)) {
          description = input.command;
        } else if (is.String(input.description)) {
          description = input.description;
        } else if (is.String(input.prompt)) {
          description = truncateText(input.prompt);
        }
      }

      parts.push(`[Tool: ${name}] ${description}`);
    } else if (item.type === "tool_result") {
      // Handle tool results
      parts.push("[Tool Result]");
    } else if (item.type === "thinking") {
      // Handle thinking messages
      parts.push("[Thinking...]");
    }
  }

  return parts.join("\n");
}
