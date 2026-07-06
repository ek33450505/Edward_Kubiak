import { Component } from "react";
import { Link } from "react-router-dom";
import PageWrapper from "./ui/PageWrapper";

/**
 * Regex covering the three common stale-chunk error messages that appear when
 * a JS chunk reference goes stale after a deploy (Vite chunk-hash rotation).
 */
const STALE_CHUNK_RE =
  /Loading chunk|dynamically imported module|Failed to fetch dynamically imported/i;

function isStaleChunkError(error) {
  const msg = error?.message ?? "";
  const name = error?.name ?? "";
  return STALE_CHUNK_RE.test(msg) || STALE_CHUNK_RE.test(name);
}

/**
 * ErrorBoundary — catches render/lazy-chunk errors and renders a branded
 * fallback panel instead of a blank screen.
 *
 * Must be mounted INSIDE <Router> so the "Back to Home" <Link> has a context.
 *
 * Two fallback variants:
 *   - staleChunk: "A new version is available" → reload CTA
 *   - generic:    "Unexpected error" → reload + back-home CTAs
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isStaleChunk: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      isStaleChunk: isStaleChunkError(error),
    };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.isStaleChunk) {
      return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-20">
          <PageWrapper>
            <div className="text-center py-20">
              <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4">
                Update available
              </p>
              <h1 className="font-mono text-2xl font-bold text-primary mb-4">
                A new version is available
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                This page couldn&apos;t load because a newer version of the site was
                deployed. Reload to get the latest version.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-background font-mono text-xs tracking-widest uppercase hover:bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Reload
              </button>
            </div>
          </PageWrapper>
        </div>
      );
    }

    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-20">
        <PageWrapper>
          <div className="text-center py-20">
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4">
              Something went wrong
            </p>
            <h1 className="font-mono text-2xl font-bold text-primary mb-4">
              Unexpected error
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Something went wrong loading this page. Try reloading or return
              home.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-background font-mono text-xs tracking-widest uppercase hover:bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Reload
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-mono text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }
}

export default ErrorBoundary;
