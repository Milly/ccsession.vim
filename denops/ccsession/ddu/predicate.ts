import { is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";

import type { CcSessionActionData } from "./types.ts";

export const isCcSessionActionData = is.ObjectOf({
  sessionId: is.String,
  sessionFilePath: is.String,
  projectPath: is.String,
  startTime: is.Number,
  endTime: is.Number,
}) satisfies Predicate<CcSessionActionData>;
