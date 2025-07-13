import { as, is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";

import type { CcSessionResumeOptions } from "./types.ts";

export const isCcSessionOptions = is.ObjectOf({
  agentCommand: as.Optional(is.String),
  agentArgs: as.Optional(is.ArrayOf(is.String)),
  cwd: as.Optional(is.String),
  terminalOpenModifier: as.Optional(is.String),
  terminalOpenFunction: as.Optional(is.String),
}) satisfies Predicate<CcSessionResumeOptions>;
