import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PULSE_END_MS } from "../lib/facilityField";
import { fadeUp } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import SectionHead from "./ui/SectionHead";

const UPDATED = "2026-10-19";

const linkClass =
  "text-primary underline underline-offset-4 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const blockLinkClass = `inline-flex items-center min-h-11 ${linkClass}`;

const checks = [
  "with axe-core's rules for WCAG 2.0 and 2.1 at levels A and AA, and WCAG 2.2 at level AA, at desktop and phone widths",
  "for reflow at 320 pixels wide, with no horizontal scrolling",
  "by keyboard: every focus stop shows a visible focus indicator, isn't hidden behind the sticky header, and doesn't trap focus, and the first stop is a skip link",
  "the command palette and mobile menu, by keyboard",
];

const Accessibility = () => {
  const motionSeconds = (PULSE_END_MS / 1000).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
  const updated = new Date(UPDATED).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-page py-20">
      <PageWrapper>
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Statement
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl">
            Accessibility
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            I want this site to work for everyone, including people who use a keyboard, a screen
            reader, zoom or reduced motion.
          </p>
          <div className="mt-5 h-px w-full bg-border" />
        </motion.div>

        <section aria-labelledby="target" className="mt-14">
          <SectionHead index="01" id="target" title="Target" />
          <p className="max-w-prose text-foreground">
            The target is WCAG 2.2 Level AA. Every page passes the automated and keyboard checks
            below. Automated tools catch only part of WCAG, and screen-reader testing isn&apos;t
            finished, so I don&apos;t claim full conformance yet.
          </p>
        </section>

        <section aria-labelledby="testing" className="mt-14">
          <SectionHead index="02" id="testing" title="How it's tested" />
          <p className="max-w-prose text-foreground">
            On every change, continuous integration builds the site and checks every page:
          </p>
          <ul className="mt-4 max-w-prose list-disc space-y-2 pl-6 text-foreground">
            {checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-4 max-w-prose text-foreground">
            Text and control colors are checked by unit tests: at least 4.5:1 for text and 3:1 for
            controls.
          </p>
        </section>

        <section aria-labelledby="motion" className="mt-14">
          <SectionHead index="03" id="motion" title="Motion" />
          <p className="max-w-prose text-foreground">
            Animations follow your reduced-motion setting. The facility map on the home page
            settles within {motionSeconds} seconds, and with reduced motion it shows a single still
            frame.
          </p>
        </section>

        <section aria-labelledby="limitations" className="mt-14">
          <SectionHead index="04" id="limitations" title="Known limitations" />
          <ul className="max-w-prose list-disc space-y-3 pl-6 text-foreground">
            <li>
              The facility map on the home page is a picture. Its information is given as text in
              the legend beside it. To explore individual facilities, use{" "}
              <a
                href="https://compute-atlas.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="compute-atlas.com (opens in new tab)"
                className={linkClass}
              >
                compute-atlas.com
                <ArrowUpRight size={14} aria-hidden="true" className="ml-1 inline-block align-middle" />
              </a>
              , which is a separate site.
            </li>
            <li>Screen-reader testing (VoiceOver) is not yet complete.</li>
            <li>
              The résumé PDFs are generated with tagged structure from the same source as the
              résumé page. The{" "}
              <Link to="/resume" className={linkClass}>
                résumé page
              </Link>{" "}
              is the primary accessible version.
            </li>
            <li>Linked external sites have their own accessibility.</li>
          </ul>
        </section>

        <section aria-labelledby="feedback" className="mt-14">
          <SectionHead index="05" id="feedback" title="Feedback" />
          <p className="max-w-prose text-foreground">
            If anything on this site is hard to use, tell me and I&apos;ll fix it.
          </p>
          <p className="mt-2">
            <Link to="/contact" className={blockLinkClass}>
              Get in touch
            </Link>
          </p>
        </section>

        <p className="mt-14 font-mono text-xs text-muted-foreground">
          Statement last updated {updated}.
        </p>
      </PageWrapper>
    </div>
  );
};

export default Accessibility;
