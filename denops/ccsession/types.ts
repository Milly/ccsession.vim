export interface CcSessionDispatcher {
  /**
   * Resumes a session with the given session ID and options.
   *
   * @param sessionId - The ID of the session to resume.
   * @param options - Optional parameters for resuming the session.
   */
  resumeSession(sessionId: string, options?: CcSessionResumeOptions): Promise<void>;
}

export interface CcSessionResumeOptions {
  /**
   * Command to run the agent.
   *
   * @default "claude"
   */
  agentCommand?: string;

  /**
   * Arguments to pass to the agent command.
   *
   * This is used when resuming a session with the agent.
   * `%{sessionId}` will be replaced with the actual session ID.
   *
   * @default ["--resume", "%{sessionId}"]
   */
  agentArgs?: string[];

  /**
   * Project directory path.
   *
   * If not specified, the current working directory will be used.
   *
   * @default "/path/to/current-working-directory"
   */
  cwd?: string;

  /**
   * Modifier commands to open a terminal window.
   *
   * This is prepended to the command used to open the terminal.
   * It must be a valid Vim command.
   *
   * For example, `"botright vertical"`.
   *
   * @default "horizontal"
   */
  terminalOpenModifier?: string;
}
