import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { fadeUp } from "../../utils/motion";
import PageWrapper from "./PageWrapper";

/**
 * NotFound — shared 404 / not-found panel.
 *
 * Used in two contexts:
 *   1. Catch-all route `<Route path="*" />` (App.jsx) — default props.
 *   2. ProjectDetail bad-slug branch — pass custom heading/message/link props.
 *
 * Props:
 *   heading    string   Large display text, default "404"
 *   title      string   Heading text after the code, default "Page not found"
 *   message    string   Helpful paragraph below the heading
 *   linkLabel  string   CTA link text, default "Back to Home"
 *   linkHref   string   CTA link destination, default "/"
 */
export default function NotFound({
  heading = "404",
  title = "Page not found",
  message = "The page you're looking for doesn't exist.",
  linkLabel = "Back to Home",
  linkHref = "/",
}) {
  return (
    <div className="min-h-page py-20">
      <PageWrapper>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.4 }}
          className="py-20 text-center"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Error · Not found
          </p>
          <h1 className="mb-4 font-mono text-4xl font-semibold tabular-nums text-foreground sm:text-5xl">
            {heading} — {title}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">{message}</p>
          <Link
            to={linkHref}
            className="inline-flex min-h-11 items-center gap-2 rounded border border-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {linkLabel}
          </Link>
        </motion.div>
      </PageWrapper>
    </div>
  );
}
