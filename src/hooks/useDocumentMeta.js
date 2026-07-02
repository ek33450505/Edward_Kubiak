import { useEffect } from "react";

/**
 * The canonical base URL for this site.
 * Used to resolve root-relative paths in `canonical` and `og:url`.
 *
 * @type {string}
 */
export const SITE_URL = "https://edwardkubiak.com";

/**
 * Normalizes a URL value to an absolute URL.
 * If the value already starts with "http" it is returned unchanged.
 * A root-relative path (starting with "/") is prefixed with SITE_URL.
 *
 * @param {string|undefined} value - Absolute URL or root-relative path
 * @returns {string|undefined}
 */
function toAbsoluteUrl(value) {
  if (!value) return value;
  if (value.startsWith("http")) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${SITE_URL}${path}`;
}

/**
 * Returns the existing DOM element that matches `selector`, or creates a new
 * `tagName` element with the given `attrs` map, appends it to <head>, and
 * returns it.  Avoids duplicate tag creation on repeated renders.
 *
 * @param {string} selector  - CSS attribute selector (e.g. 'meta[name="description"]')
 * @param {string} tagName   - Tag to create when missing ('meta' | 'link')
 * @param {Record<string, string>} attrs - Attributes applied only when creating the element
 * @returns {Element}
 */
function getOrCreateTag(selector, tagName, attrs) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Per-route document meta manager.
 *
 * Imperatively sets page-level meta tags for the duration of the calling
 * component and RESTORES the previous values on unmount or dependency change.
 * This prevents the blank-og:image bug that occurs when raw effects clear
 * attributes in their cleanup without restoring prior content.
 *
 * Managed tags:
 *  - `document.title`
 *  - `<meta name="description">`
 *  - `<link rel="canonical">`
 *  - `<meta property="og:title">`   (falls back to `title`)
 *  - `<meta property="og:description">` (falls back to `description`)
 *  - `<meta property="og:url">`     (follows `canonical`)
 *  - `<meta property="og:image">`
 *
 * @param {object} [meta] - Meta values for the current route; omit any field to leave that tag unchanged
 * @param {string} [meta.title]         - Document title; also used as og:title when ogTitle is absent
 * @param {string} [meta.description]   - Meta description; also used as og:description when ogDescription is absent
 * @param {string} [meta.canonical]     - Canonical URL (absolute) or root-relative path; also sets og:url
 * @param {string} [meta.ogTitle]       - Open Graph title override (defaults to title)
 * @param {string} [meta.ogDescription] - Open Graph description override (defaults to description)
 * @param {string} [meta.ogImage]       - Open Graph image URL
 * @returns {void}
 */
export function useDocumentMeta({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
} = {}) {
  useEffect(() => {
    // SSR safety guard — app is client-only but defensive coding costs nothing
    if (typeof document === "undefined") return;

    const resolvedCanonical = toAbsoluteUrl(canonical);
    const resolvedOgTitle = ogTitle ?? title;
    const resolvedOgDesc = ogDescription ?? description;

    // --- capture existing values before mutating ---

    const prevTitle = document.title;

    const descEl = getOrCreateTag('meta[name="description"]', "meta", {
      name: "description",
      content: "",
    });
    const prevDesc = descEl.getAttribute("content") ?? "";

    const canonicalEl = getOrCreateTag('link[rel="canonical"]', "link", {
      rel: "canonical",
      href: "",
    });
    const prevCanonical = canonicalEl.getAttribute("href") ?? "";

    const ogTitleEl = getOrCreateTag('meta[property="og:title"]', "meta", {
      property: "og:title",
      content: "",
    });
    const prevOgTitle = ogTitleEl.getAttribute("content") ?? "";

    const ogDescEl = getOrCreateTag('meta[property="og:description"]', "meta", {
      property: "og:description",
      content: "",
    });
    const prevOgDesc = ogDescEl.getAttribute("content") ?? "";

    const ogUrlEl = getOrCreateTag('meta[property="og:url"]', "meta", {
      property: "og:url",
      content: "",
    });
    const prevOgUrl = ogUrlEl.getAttribute("content") ?? "";

    const ogImageEl = getOrCreateTag('meta[property="og:image"]', "meta", {
      property: "og:image",
      content: "",
    });
    const prevOgImage = ogImageEl.getAttribute("content") ?? "";

    // --- apply new values (only when the caller provided them) ---

    if (title !== undefined) document.title = title;
    if (description !== undefined) descEl.setAttribute("content", description);
    if (resolvedCanonical !== undefined) {
      canonicalEl.setAttribute("href", resolvedCanonical);
      ogUrlEl.setAttribute("content", resolvedCanonical);
    }
    if (resolvedOgTitle !== undefined) ogTitleEl.setAttribute("content", resolvedOgTitle);
    if (resolvedOgDesc !== undefined) ogDescEl.setAttribute("content", resolvedOgDesc);
    if (ogImage !== undefined) ogImageEl.setAttribute("content", ogImage);

    // --- cleanup: restore previous values so unmount never blanks the tags ---
    return () => {
      document.title = prevTitle;
      descEl.setAttribute("content", prevDesc);
      canonicalEl.setAttribute("href", prevCanonical);
      ogTitleEl.setAttribute("content", prevOgTitle);
      ogDescEl.setAttribute("content", prevOgDesc);
      ogUrlEl.setAttribute("content", prevOgUrl);
      ogImageEl.setAttribute("content", prevOgImage);
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage]);
}
