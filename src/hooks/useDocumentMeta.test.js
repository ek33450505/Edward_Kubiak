/**
 * Tests for useDocumentMeta.js
 *
 * Uses @testing-library/react renderHook + jsdom to exercise the DOM
 * side-effects and restore-on-unmount behaviour without mounting a component.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentMeta, SITE_URL } from "./useDocumentMeta";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMeta(selector) {
  return document.querySelector(selector);
}

function getContent(selector) {
  return getMeta(selector)?.getAttribute("content") ?? null;
}

function getHref(selector) {
  return getMeta(selector)?.getAttribute("href") ?? null;
}

// ---------------------------------------------------------------------------
// Reset head between tests to avoid bleed-through
// ---------------------------------------------------------------------------

beforeEach(() => {
  // restore document.title
  document.title = "Test Page";

  // Remove any dynamically-created tags (leave no bleed between tests)
  [
    'meta[name="description"]',
    'link[rel="canonical"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
  ].forEach((sel) => getMeta(sel)?.remove());
});

// ---------------------------------------------------------------------------
// SITE_URL export
// ---------------------------------------------------------------------------

describe("SITE_URL export", () => {
  it("exports the canonical site URL", () => {
    expect(SITE_URL).toBe("https://edwardkubiak.com");
  });
});

// ---------------------------------------------------------------------------
// document.title
// ---------------------------------------------------------------------------

describe("document.title", () => {
  it("sets document.title when title is provided", () => {
    renderHook(() => useDocumentMeta({ title: "About — Edward Kubiak" }));
    expect(document.title).toBe("About — Edward Kubiak");
  });

  it("restores the previous document.title on unmount", () => {
    document.title = "Original Title";
    const { unmount } = renderHook(() =>
      useDocumentMeta({ title: "Route Title" })
    );
    expect(document.title).toBe("Route Title");
    unmount();
    expect(document.title).toBe("Original Title");
  });

  it("leaves document.title unchanged when title is not provided", () => {
    document.title = "Unchanged";
    renderHook(() => useDocumentMeta({ description: "only description" }));
    expect(document.title).toBe("Unchanged");
  });
});

// ---------------------------------------------------------------------------
// meta[name="description"]
// ---------------------------------------------------------------------------

describe("meta[name='description']", () => {
  it("sets meta description content", () => {
    renderHook(() => useDocumentMeta({ description: "A great page." }));
    expect(getContent('meta[name="description"]')).toBe("A great page.");
  });

  it("restores previous description on unmount", () => {
    // Seed an existing description tag
    const el = document.createElement("meta");
    el.setAttribute("name", "description");
    el.setAttribute("content", "Default description");
    document.head.appendChild(el);

    const { unmount } = renderHook(() =>
      useDocumentMeta({ description: "Route description" })
    );
    expect(getContent('meta[name="description"]')).toBe("Route description");
    unmount();
    expect(getContent('meta[name="description"]')).toBe("Default description");
  });
});

// ---------------------------------------------------------------------------
// link[rel="canonical"] + og:url
// ---------------------------------------------------------------------------

describe("canonical / og:url", () => {
  it("sets canonical href from an absolute URL", () => {
    renderHook(() =>
      useDocumentMeta({ canonical: "https://edwardkubiak.com/about" })
    );
    expect(getHref('link[rel="canonical"]')).toBe(
      "https://edwardkubiak.com/about"
    );
  });

  it("expands a root-relative path to an absolute URL using SITE_URL", () => {
    renderHook(() => useDocumentMeta({ canonical: "/projects" }));
    expect(getHref('link[rel="canonical"]')).toBe(
      "https://edwardkubiak.com/projects"
    );
    expect(getContent('meta[property="og:url"]')).toBe(
      "https://edwardkubiak.com/projects"
    );
  });

  it("sets og:url to the same resolved URL as canonical", () => {
    renderHook(() =>
      useDocumentMeta({ canonical: "https://edwardkubiak.com/now" })
    );
    expect(getContent('meta[property="og:url"]')).toBe(
      "https://edwardkubiak.com/now"
    );
  });

  it("restores previous canonical href on unmount", () => {
    const el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    el.setAttribute("href", "https://edwardkubiak.com/");
    document.head.appendChild(el);

    const { unmount } = renderHook(() =>
      useDocumentMeta({ canonical: "/projects" })
    );
    unmount();
    expect(getHref('link[rel="canonical"]')).toBe("https://edwardkubiak.com/");
  });
});

// ---------------------------------------------------------------------------
// OG fallbacks: ogTitle → title, ogDescription → description
// ---------------------------------------------------------------------------

describe("OG tag fallbacks", () => {
  it("uses title as og:title fallback when ogTitle is not provided", () => {
    renderHook(() => useDocumentMeta({ title: "My Page" }));
    expect(getContent('meta[property="og:title"]')).toBe("My Page");
  });

  it("uses an explicit ogTitle in preference to title", () => {
    renderHook(() =>
      useDocumentMeta({ title: "My Page", ogTitle: "OG Override" })
    );
    expect(getContent('meta[property="og:title"]')).toBe("OG Override");
  });

  it("uses description as og:description fallback when ogDescription is not provided", () => {
    renderHook(() => useDocumentMeta({ description: "Page desc" }));
    expect(getContent('meta[property="og:description"]')).toBe("Page desc");
  });

  it("uses an explicit ogDescription in preference to description", () => {
    renderHook(() =>
      useDocumentMeta({
        description: "Page desc",
        ogDescription: "OG desc override",
      })
    );
    expect(getContent('meta[property="og:description"]')).toBe("OG desc override");
  });
});

// ---------------------------------------------------------------------------
// og:image
// ---------------------------------------------------------------------------

describe("og:image", () => {
  it("sets og:image content", () => {
    renderHook(() =>
      useDocumentMeta({ ogImage: "https://edwardkubiak.com/og-project.png" })
    );
    expect(getContent('meta[property="og:image"]')).toBe(
      "https://edwardkubiak.com/og-project.png"
    );
  });

  it("restores previous og:image on unmount (fixes ProjectDetail blank bug)", () => {
    const el = document.createElement("meta");
    el.setAttribute("property", "og:image");
    el.setAttribute("content", "https://edwardkubiak.com/og-image.png");
    document.head.appendChild(el);

    const { unmount } = renderHook(() =>
      useDocumentMeta({ ogImage: "https://edwardkubiak.com/og-project.png" })
    );
    expect(getContent('meta[property="og:image"]')).toBe(
      "https://edwardkubiak.com/og-project.png"
    );
    unmount();
    // Must restore to the default, NOT blank it
    expect(getContent('meta[property="og:image"]')).toBe(
      "https://edwardkubiak.com/og-image.png"
    );
  });
});

// ---------------------------------------------------------------------------
// No-op when called with no arguments
// ---------------------------------------------------------------------------

describe("no-op call", () => {
  it("does not throw when called with no arguments", () => {
    expect(() => renderHook(() => useDocumentMeta())).not.toThrow();
  });
});
