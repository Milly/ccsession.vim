import { abortable } from "jsr:@std/async@^1.0.0/abortable";
import { ensure } from "jsr:@core/unknownutil@^4.3.0/ensure";
import {
  type ActionArguments,
  ActionFlags,
} from "jsr:@shougo/ddu-vim@^10.3.0/types";
import { printError } from "jsr:@shougo/ddu-vim@^10.3.0/utils";

import { CcSessionActionData, CcSessionKindParams } from "../types.ts";
import { isCcSessionActionData } from "../predicate.ts";
import { defaultParams } from "../kind.ts";
import { CcSessionDispatcher } from "../../types.ts";

/**
 * Action callback to resume Claude Code session(s).
 *
 * If denops is interrupted, the action will stop processing further items.
 */
export async function resumeSession(
  { denops, items, kindParams }: ActionArguments<CcSessionKindParams>,
): Promise<ActionFlags> {
  const { maxSelectionsToResume, ...resumeOptions } = {
    ...defaultParams(),
    ...kindParams,
  };
  const signal = denops.interrupted ?? AbortSignal.any([]);

  if (items.length > maxSelectionsToResume) {
    await printError(
      denops,
      "ddu-kind-ccsession-resume: Cannot resume too many sessions." +
        " See `:help ddu-kind-ccsession-params-maxSelectionsToResume`.",
    );
    return ActionFlags.None;
  }

  for (const item of items) {
    try {
      signal.throwIfAborted();

      const { sessionId, projectPath } = ensure<CcSessionActionData>(
        item.action,
        isCcSessionActionData,
        { name: "item.action" },
      );

      const resumeArgs: Parameters<CcSessionDispatcher["resume"]> = [
        sessionId,
        { cwd: projectPath, ...resumeOptions },
      ];

      await abortable(
        denops.dispatch("ccsession", "resume", ...resumeArgs),
        signal,
      );
    } catch (error) {
      if (error === signal.reason) break;
      await printError(
        denops,
        "ddu-kind-ccsession-resume: Failed to resume session.",
        error instanceof Error && error.stack || error,
      );
    }
  }

  return ActionFlags.None;
}
