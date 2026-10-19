import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { contact } from "../data/resume";
import { fadeUp } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import Label from "./ui/Label";

const linkBase =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const Contact = () => (
  <div className="min-h-page py-20">
    <PageWrapper>
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">
          Contact
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Work, a project, or an idea. I read everything.
        </p>
        <div className="mt-5 h-px w-full bg-border" />
      </motion.div>

      <section className="panel mt-10">
        <div className="panel-head">
          <Label as="h2" variant="panel">01 / Reach me</Label>
        </div>
        <div className="p-6 sm:p-8">
          <p className="mb-6 text-foreground">
            The quickest way to reach me is a message on LinkedIn.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://www.${contact.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message me on LinkedIn (opens in new tab)"
              className={`${linkBase} bg-primary text-primary-foreground hover:opacity-90`}
            >
              Message me on LinkedIn
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/ek33450505"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub (opens in new tab)"
              className={`${linkBase} border border-border-strong text-foreground hover:bg-card`}
            >
              GitHub
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </PageWrapper>
  </div>
);

export default Contact;
