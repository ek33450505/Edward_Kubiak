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
          className="text-center py-20"
        >
          <p className="font-display text-4xl font-bold text-slate-600 mb-4">
            {heading}
          </p>
          <h1 className="font-display text-xl font-bold text-slate-200 mb-6">
            {message}
          </h1>
          <Link
            to={linkHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-widest uppercase hover:border-accent-400 hover:text-accent-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {linkLabel}
          </Link>
        </motion.div>
      </PageWrapper>
    </div>
  );
}
