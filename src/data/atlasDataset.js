// Compute Atlas's schema.org Dataset facts — the single source for the Dataset node on
// the compute-atlas project page. Mirrors Compute Atlas's own Dataset JSON-LD: the site
// is the dataset's home, with no DOI (Compute Atlas stopped citing its Zenodo record in
// November 2026).
export const ATLAS_DATASET = {
  url: "https://www.compute-atlas.com",
  title: "Compute Atlas: a source-cited dataset of U.S. data centers, crypto-mining sites, and dedicated power generation",
  description:
    "Compute Atlas is a curated, human-moderated dataset tracking AI and traditional data centers, crypto-mining operations, and dedicated power-generation facilities built to supply them, across the United States. Every record traces to a real, citable public source — press coverage, filings, permits, or government data — and spans the full project lifecycle from proposed through operational.",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  publisher: "Compute Atlas",
};
