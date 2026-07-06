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
 *   message    string   Sub-heading below the display text
 *   linkLabel  string   CTA link text, default "Back to Home"
 *   linkHref   string   CTA link destination, default "/"
 */
export default function NotFound({
  heading = "404",
  message = "The page you're looking for doesn't exist.",
  linkLabel = "Back to Home",
  linkHref = "/",
}) {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.4 }}
          className="py-20 text-center"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Off the map · No such coordinate
          </p>
          <p className="mb-4 font-mono text-6xl font-semibold tabular-nums text-foreground">
            {heading}
          </p>
          <h1 className="mb-8 font-display text-2xl font-semibold tracking-tight text-muted-foreground">
            {message}
          </h1>
          <Link
            to={linkHref}
            className="inline-flex items-center gap-2 rounded border border-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {linkLabel}
          </Link>
        </motion.div>
      </PageWrapper>
    </div>
  );
}
