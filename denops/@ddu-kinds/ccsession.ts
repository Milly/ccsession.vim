import type { Actions } from "jsr:@shougo/ddu-vim@^10.3.0/types";
import { BaseKind } from "jsr:@shougo/ddu-vim@^10.3.0/kind";

import type { CcSessionKindParams } from "../ccsession/ddu/types.ts";
import { sessionActions } from "../ccsession/ddu/action.ts";
import { defaultParams } from "../ccsession/ddu/kind.ts";

export class Kind extends BaseKind<CcSessionKindParams> {
  override actions = {
    ...sessionActions,
  } satisfies Actions<CcSessionKindParams>;

  override params(): CcSessionKindParams {
    return defaultParams();
  }
}
