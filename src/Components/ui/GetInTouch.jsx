import { motion } from "motion/react";
import { Mail, Heart, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../BrandIcons";
import { fadeUp } from "../../utils/motion";
import Label from "./Label";

export default function GetInTouch() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: 0.1 }}
      className="p-6 sm:p-8 card"
    >
      <div className="text-center">
        <Label as="h2" className="mb-2">Get in Touch</Label>
        <p className="text-sm text-slate-400 mb-6">
          Open to new opportunities, collaborations, and conversations about developer tooling.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href="mailto:edward.kubiak.dev@gmail.com"
          aria-label="Email Edward at edward.kubiak.dev@gmail.com"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-accent-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 transition-all"
        >
          <Mail size={20} className="text-accent-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
            Email
          </span>
        </a>

        <a
          href="https://www.linkedin.com/in/edward-kubiak/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Connect on LinkedIn (opens in new tab)"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-sky-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 transition-all"
        >
          <LinkedinIcon size={20} className="text-sky-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
            LinkedIn
          </span>
        </a>

        <a
          href="https://github.com/ek33450505"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Edward's GitHub profile (opens in new tab)"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-slate-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 transition-all"
        >
          <GithubIcon size={20} className="text-slate-200 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
            GitHub
          </span>
        </a>

        <a
          href="https://github.com/sponsors/ek33450505"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sponsor Edward's open source work on GitHub (opens in new tab)"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-rose-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 transition-all"
        >
          <Heart size={20} className="text-rose-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
            Sponsor
          </span>
        </a>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
        <a
          href="mailto:edward.kubiak.dev@gmail.com"
          className="inline-flex items-center gap-2 font-display text-sm sm:text-base text-accent-400 hover:text-accent-300 transition-colors group"
        >
          edward.kubiak.dev@gmail.com
          <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
        </a>
      </div>
    </motion.div>
  );
}
