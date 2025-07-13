import type { Actions } from "jsr:@shougo/ddu-vim@^10.3.0/types";

import type { CcSessionKindParams } from "./types.ts";
import { resumeSession } from "./actions/resume_session.ts";

export const sessionActions = {
  resumeSession: {
    description: "Resumes Claude Code session(s)",
    callback: resumeSession,
  },
} satisfies Actions<CcSessionKindParams>;
