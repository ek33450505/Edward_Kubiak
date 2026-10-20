// Parse / render the generated src/data/*.js modules WITHOUT importing or evaluating them.
//
// Every generated module is banner comments plus `export const NAME = <JSON>;` blocks, where
// each value was written with JSON.stringify(value, null, 2). parseDataModule splits the text
// into literal "segments" (banner, blank lines, `export const NAME = `, `;`) and the parsed
// JSON values; renderDataModule is the exact inverse. A caller that re-renders new values into
// the OLD segments therefore cannot smuggle code in through anything outside the values.

const EXPORT_RE = /^export const ([A-Z][A-Z0-9_]*) = /gm;

// Index just past the bracket that closes the object/array starting at `start`
// (string-aware, so brackets inside JSON strings do not count).
function scanValueEnd(text, start) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("data-module: unterminated value");
}

// JSON.parse makes "__proto__" an own property, but a JS object literal sets the prototype
// instead, so the parsed view and the runtime view of such a module would differ.
function hasProtoKey(value) {
  if (value === null || typeof value !== "object") return false;
  if (Object.hasOwn(value, "__proto__")) return true;
  return Object.values(value).some(hasProtoKey);
}

export function parseDataModule(text) {
  if (typeof text !== "string") throw new Error("data-module: text must be a string");
  // Line terminators JS treats differently from JSON, and CR, are never in generated output.
  if (/[\u2028\u2029\r]/.test(text)) {
    throw new Error("data-module: text contains a raw U+2028, U+2029 or CR character");
  }
  const segments = [];
  const exports = [];
  let cursor = 0;

  EXPORT_RE.lastIndex = 0;
  for (;;) {
    EXPORT_RE.lastIndex = cursor;
    const m = EXPORT_RE.exec(text);
    if (!m) break;
    const name = m[1];
    if (exports.some((e) => e.name === name)) {
      throw new Error(`data-module: duplicate export ${name}`);
    }
    const valueStart = m.index + m[0].length;
    const first = text[valueStart];
    if (first !== "{" && first !== "[") {
      throw new Error(`data-module: ${name} is not an object or array`);
    }
    const valueEnd = scanValueEnd(text, valueStart);
    if (text[valueEnd] !== ";") {
      throw new Error(`data-module: ${name} is not terminated by ";"`);
    }
    const source = text.slice(valueStart, valueEnd);
    let value;
    try {
      value = JSON.parse(source);
    } catch (err) {
      throw new Error(`data-module: ${name} is not valid JSON (${err.message})`);
    }
    if (hasProtoKey(value)) {
      throw new Error(`data-module: ${name} contains an own "__proto__" key`);
    }
    if (JSON.stringify(value, null, 2) !== source) {
      throw new Error(`data-module: ${name} does not round-trip through JSON.stringify(v, null, 2)`);
    }
    segments.push(text.slice(cursor, valueStart));
    exports.push({ name, value });
    cursor = valueEnd;
  }

  if (!exports.length) throw new Error("data-module: no `export const NAME = ` found");
  segments.push(text.slice(cursor));
  return { segments, exports };
}

export function renderDataModule(segments, exports) {
  if (!Array.isArray(segments) || !Array.isArray(exports) || segments.length !== exports.length + 1) {
    throw new Error("data-module: segments must have exactly exports.length + 1 entries");
  }
  let out = segments[0];
  for (let i = 0; i < exports.length; i++) {
    out += JSON.stringify(exports[i].value, null, 2) + segments[i + 1];
  }
  return out;
}

// Formatting of the committed public/*.json feeds: pretty (2-space) or compact, with or without
// a trailing newline. renderJsonLike(JSON.parse(t), jsonStyleOf(t)) reproduces t for those feeds.
export function jsonStyleOf(text) {
  if (typeof text !== "string") throw new Error("data-module: text must be a string");
  const trailingNewline = text.endsWith("\n");
  const body = trailingNewline ? text.slice(0, -1) : text;
  return { pretty: /^[{[]\n {2}\S/.test(body), trailingNewline };
}

export function renderJsonLike(value, style) {
  const body = style.pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  return style.trailingNewline ? `${body}\n` : body;
}
