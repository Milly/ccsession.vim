import { isAbsolute, join } from "jsr:@std/path@^1.0.0";
import { from } from "jsr:@milly/streams@^1.0.4/readable/from";
import { bufferCount } from "jsr:@milly/streams@^1.0.4/transform/buffer-count";
import { map } from "jsr:@milly/streams@^1.0.4/transform/map";
import {
  BaseSource,
  type GatherArguments,
} from "jsr:@shougo/ddu-vim@^10.3.0/source";
import {
  type Context,
  type Item,
} from "jsr:@shougo/ddu-vim@^10.3.0/types";

import {
  formatSessionSummary,
  getAllSessions,
  getProjectSessions,
} from "../ccsession/claude/session.ts";
import { Session } from "../ccsession/claude/types.ts";
import {
  CcSessionActionData,
  CcSessionSourceParams,
} from "../ccsession/ddu/types.ts";

type SourceParams = Required<CcSessionSourceParams>;
type SessionItem = Item<CcSessionActionData>;

const BUFFER_SIZE = 200;

export class Source extends BaseSource<SourceParams> {
  override kind = "ccsession" as const;

  override gather(
    {
      context,
      sourceParams,
    }: GatherArguments<SourceParams>,
  ): ReadableStream<SessionItem[]> {
    return from(genSessions(context, sourceParams))
      .pipeThrough(map((session) => sessionToItem(session, sourceParams)))
      .pipeThrough(bufferCount(BUFFER_SIZE));
  }

  override params(): SourceParams {
    return {
      all: false,
      projectPaths: [],
    };
  }
}

async function* genSessions(
  context: Context,
  sourceParams: SourceParams,
) {
  if (sourceParams.all) {
    yield* getAllSessions();
  } else {
    const { cwd } = context;
    const projectPaths = sourceParams.projectPaths.length === 0
      // If no project paths are specified, use the CWD
      ? [cwd]
      // Otherwise, resolve each path relative to the CWD
      : sourceParams.projectPaths.map((path) =>
        isAbsolute(path) ? path : join(cwd, path)
      );
    yield* getProjectSessions(projectPaths);
  }
}

function sessionToItem(
  session: Session,
  sourceParams: SourceParams,
): SessionItem {
  const {
    sessionFilePath,
    sessionId,
    projectPath,
    projectName,
    startTime,
    endTime,
  } = session;
  const datetime = endTime.toLocaleString();
  const summary = formatSessionSummary(session);
  let word = `${datetime}: ${summary}`;
  if (sourceParams.all) {
    word = `${projectName}:${word}`;
  }
  return {
    word,
    action: {
      sessionId,
      sessionFilePath,
      projectPath,
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
    },
  };
}
