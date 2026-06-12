import { motion } from "motion/react";
import now from "../data/now";
import { fadeUp, fadeIn } from "../utils/motion";
import SectionHeader from "./ui/SectionHeader";
import PageWrapper from "./ui/PageWrapper";

const Now = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <SectionHeader
            as="h1"
            headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            underlineClassName="mt-3"
            title="Now"
          />
          <p className="mt-4 text-slate-400 text-sm">
            What I&apos;m focused on right now &middot; Last updated{" "}
            <span className="text-slate-300">{now.updated}</span>
          </p>
        </motion.div>

        <div className="mt-10 space-y-6">
          {now.sections.map((section, i) => (
            <motion.div
              key={section.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <h2 className="font-display text-xs tracking-[0.3em] text-amber-400 uppercase mb-4">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-sm text-slate-300 leading-relaxed pl-4 relative"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-amber-400/40"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-xs text-slate-600 font-display tracking-wider"
        >
          Inspired by{" "}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="nownownow.com about page (opens in new tab)"
            className="hover:text-slate-400 transition-colors"
          >
            nownownow.com
          </a>
        </motion.p>
      </PageWrapper>
    </div>
  );
};

export default Now;
