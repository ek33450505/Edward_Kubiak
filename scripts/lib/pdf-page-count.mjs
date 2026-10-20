// Page-count gate helper. Imports nothing (no puppeteer) so a job without node_modules can run it.
//
// Nothing pinned the resume's length before this, so it could silently grow past
// the two-page budget on any content edit. Two independent counts are taken from
// the PDF's own bytes and must agree; anything ambiguous THROWS rather than
// passing, because a check that cannot determine its answer must not report
// success. A passing check while the budget is blown looks like: the assertion
// below never fires — which is exactly why maxPages is mutation-tested.
export function pdfPageCount(bytes) {
  // page.pdf() resolves a Uint8Array on current Puppeteer, not a Buffer — calling
  // .toString("latin1") on it ignores the encoding and yields comma-joined digits,
  // which silently matches nothing. Normalize before reading.
  const raw = Buffer.from(bytes).toString("latin1");

  // Count 1: page objects in the document (/Type /Page, never /Type /Pages).
  const pageObjects = (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length;

  // Count 2: the page-tree root's declared /Count. Take the largest declared
  // count, which is the root of the tree.
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const declared = counts.length ? Math.max(...counts) : null;

  if (!pageObjects) {
    throw new Error("page-count gate: found no page objects in the generated PDF");
  }
  if (declared === null) {
    throw new Error("page-count gate: PDF declares no page-tree /Count");
  }
  if (declared !== pageObjects) {
    throw new Error(
      `page-count gate: the two counts disagree (${pageObjects} page objects vs /Count ${declared}) — refusing to guess`
    );
  }
  return declared;
}
