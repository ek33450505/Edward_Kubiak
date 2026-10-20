import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** True when argv1 and moduleUrl resolve to the same real file (symlink-safe); a missing argv1 is "not direct". */
export function isDirectInvocation(argv1, moduleUrl) {
  try {
    return fs.realpathSync(argv1) === fs.realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
