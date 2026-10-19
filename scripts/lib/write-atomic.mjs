import fs from "node:fs";

// Writes via a same-directory temp file + rename, so a target is never half-written.
export function writeAtomic(target, content) {
  const tmp = `${target}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, target);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}
