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

    const stale = this.state.isStaleChunk;
    const reloadClass =
      "inline-flex items-center gap-2 min-h-11 px-6 py-3 rounded bg-primary text-primary-foreground font-mono text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
    const homeClass =
      "inline-flex items-center gap-2 min-h-11 px-5 py-2.5 rounded border border-border-strong text-foreground font-mono text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

    return (
      <div className="min-h-page flex items-center justify-center py-20">
        <PageWrapper>
          <div role="alert" className="panel mx-auto max-w-xl text-center">
            <div className="panel-head">
              <span>{stale ? "Update available" : "Error"}</span>
            </div>
            <div className="px-6 py-12">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground mb-4">
                {stale ? "A new version is available" : "Unexpected error"}
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {stale
                  ? "This page couldn\u2019t load because a newer version of the site was deployed. Reload to get the latest version."
                  : "Something went wrong loading this page. Try reloading or return home."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => window.location.reload()} className={reloadClass}>
                  Reload
                </button>
                <Link to="/" className={homeClass}>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }
}

export default ErrorBoundary;
