// Compute Atlas's Zenodo dataset record — the single source for the DOI shown on the
// site, the résumé, and the schema.org Dataset node. Uses the CONCEPT DOI (always
// resolves to the latest version); never pin the version DOI, which would drift
// behind the live Atlas release.
export const ATLAS_DATASET = {
  doi: "10.5281/zenodo.22284476",
  doiUrl: "https://doi.org/10.5281/zenodo.22284476",
  title: "Compute Atlas: a source-cited dataset of U.S. data centers, crypto-mining sites, and dedicated power generation",
  description:
    "Compute Atlas is a curated, human-moderated dataset tracking AI and traditional data centers, crypto-mining operations, and dedicated power-generation facilities built to supply them, across the United States. Every record traces to a real, citable public source — press coverage, filings, permits, or government data — and spans the full project lifecycle from proposed through operational.",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  publisher: "Zenodo",
};
