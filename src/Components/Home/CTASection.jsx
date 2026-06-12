import { motion } from "motion/react";
import { ExternalLink, Heart } from "lucide-react";
import { fadeUp } from "../../utils/motion";
import { CAST_STATS } from "../../data/castStats";
import SectionHeader from "../ui/SectionHeader";

export default function CTASection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
      aria-labelledby="support-heading"
    >
      <div className="mb-6">
        <SectionHeader id="support-heading" title="Support My Work" />
      </div>

      <div className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm hover:border-amber-400/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="shrink-0">
            <Heart
              size={28}
              className="text-amber-400"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold tracking-wide text-slate-100 mb-1">
              Sponsor open-source work on GitHub
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              CAST, cast-dash, Claude's Journal, and the {CAST_STATS.packages}-tap ecosystem are
              built and maintained in the open. If they save you time, a sponsorship
              keeps the next release coming.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-2 items-start md:items-end">
            <iframe
              src="https://github.com/sponsors/ek33450505/button"
              title="Sponsor ek33450505 on GitHub"
              height="32"
              width="114"
              style={{ border: 0, borderRadius: 6 }}
            />
            <a
              href="https://github.com/sponsors/ek33450505"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-display tracking-wider uppercase text-slate-400 hover:text-amber-400 transition-colors"
              aria-label="Open GitHub Sponsors page in a new tab"
            >
              View tiers
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
