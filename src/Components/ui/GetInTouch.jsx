import { Link } from "react-router-dom";
import { Mail, Heart, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../BrandIcons";
import Label from "./Label";
import Reveal from "./Reveal";
import { SponsorButton } from "./SponsorDialog";

export default function GetInTouch() {
  return (
    <Reveal transition={{ delay: 0.1 }} className="panel">
      <div className="panel-head">
        <Label as="h2" variant="panel">Get in Touch</Label>
      </div>
      <div className="p-6 sm:p-8">
        <p className="text-sm text-muted-foreground mb-6">
          Open to new opportunities, collaborations, and conversations about developer tooling.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/contact"
            aria-label="Contact: ways to reach Edward"
            className="group flex flex-col items-center gap-2 p-4 card-interactive min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Mail size={20} className="text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
              Contact
            </span>
          </Link>

          <a
            href="https://www.linkedin.com/in/edward-kubiak/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect on LinkedIn (opens in new tab)"
            className="group flex flex-col items-center gap-2 p-4 card-interactive min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <LinkedinIcon size={20} className="text-water group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
              LinkedIn
            </span>
          </a>

          <a
            href="https://github.com/ek33450505"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Edward's GitHub profile (opens in new tab)"
            className="group flex flex-col items-center gap-2 p-4 card-interactive min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <GithubIcon size={20} className="text-foreground group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
              GitHub
            </span>
          </a>

          <SponsorButton
            aria-label="Sponsor Edward's open source work: choose GitHub Sponsors or Ko-fi"
            className="group flex flex-col items-center gap-2 p-4 card-interactive min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Heart size={20} className="text-terra group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
              Sponsor
            </span>
          </SponsorButton>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 min-h-11 font-mono text-sm sm:text-base text-primary hover:underline underline-offset-4 transition-colors group"
          >
            Get in touch
            <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
