import type { CcSessionKindParamsBase } from "./types.ts";

/**
 * Default parameters for the CcSession kind.
 *
 * This is used to ensure that the kind has a consistent set of parameters.
 */
export function defaultParams(): Required<CcSessionKindParamsBase> {
  return {
    maxSelectionsToResume: 1,
  };
}
