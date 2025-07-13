import { CcSessionResumeOptions } from "../types.ts";

export interface CcSessionKindParamsBase {
  /**
   * Maximum number of sessions that can be resumed from multiple selections.
   *
   * This limit prevents accidentally launching too many sessions at once.
   *
   * @default 1
   */
  maxSelectionsToResume?: number;
}

export type CcSessionKindParams = Partial<
  & CcSessionKindParamsBase
  & CcSessionResumeOptions
>;

export interface CcSessionSourceParams {
  /**
   * Whether to gather all sessions or only those for the current project.
   *
   * @default false
   */
  all?: boolean;

  /**
   * Paths to project directories to search for sessions.
   *
   * If not specified or empty array, the current working directory will be used.
   * Relative paths are treated as relative to the current working directory.
   *
   * @default ["/path/to/current-working-directory"]
   */
  projectPaths?: string[];
}

export interface CcSessionActionData {
  sessionId: string;
  sessionFilePath: string;
  projectPath: string;
  startTime: number;
  endTime: number;
}
