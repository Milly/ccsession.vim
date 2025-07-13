import type { Denops, Dispatcher, Entrypoint } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { ensure, is } from "jsr:@core/unknownutil@^4.3.0";
import { isCcSessionOptions } from "./predicate.ts";
import type { CcSessionDispatcher, CcSessionResumeOptions } from "./types.ts";

const SESSION_ID_PLACEHOLDER = "%{sessionId}" as const;

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    async resumeSession(...args) {
      try {
        const sessionId = ensure(args[0], is.String, { name: "sessionId" });
        const options = await ensureOptions(denops, args[1]);
        const modifier = options.terminalOpenModifier;
        const fn = denops.meta.host === "vim" ? "term_start" : "jobstart";
        const fnOpts = {
          cwd: options.cwd,
          ...(denops.meta.host === "vim" ? {} : { term: true }),
        };
        const cmd = [
          options.agentCommand,
          ...options.agentArgs.map((arg) =>
            arg.replaceAll(SESSION_ID_PLACEHOLDER, sessionId)
          ),
        ];
        await denops.cmd(
          `${modifier} call call(fn, [cmd, fnOpts])`,
          { fn, fnOpts, cmd },
        );
      } catch (error) {
        await printError(denops, `Failed to resume agent:`, error);
      }
    },
  } satisfies Record<keyof CcSessionDispatcher, Dispatcher[string]>;
};

async function ensureOptions(
  denops: Denops,
  options: unknown,
): Promise<Required<CcSessionResumeOptions>> {
  const {
    agentCommand = "claude",
    agentArgs = ["--resume", SESSION_ID_PLACEHOLDER],
    cwd = await fn.getcwd(denops),
    terminalOpenModifier = "horizontal",
  } = ensure(options, isCcSessionOptions, { name: "options" });
  return {
    agentCommand,
    agentArgs,
    cwd,
    terminalOpenModifier,
  };
}

async function printError(
  denops: Denops,
  ...messages: unknown[]
): Promise<void> {
  const message = messages.map(String).join("\n");
  await helper.echoerr(denops, `[${denops.name}] ${message}`);
}
