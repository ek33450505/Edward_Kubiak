import { Mail, Heart, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../BrandIcons";
import Label from "./Label";
import Reveal from "./Reveal";

export default function GetInTouch() {
  return (
    <Reveal transition={{ delay: 0.1 }} className="p-6 sm:p-8 card">
      <div className="text-center">
        <Label as="h2" className="mb-2">Get in Touch</Label>
        <p className="text-sm text-muted-foreground mb-6">
          Open to new opportunities, collaborations, and conversations about developer tooling.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href="mailto:edward.kubiak.dev@gmail.com"
          aria-label="Email Edward at edward.kubiak.dev@gmail.com"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
        >
          <Mail size={20} className="text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
            Email
          </span>
        </a>

        <a
          href="https://www.linkedin.com/in/edward-kubiak/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Connect on LinkedIn (opens in new tab)"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 bg-card/40 hover:border-water/40 hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water/60 transition-all"
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
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 bg-card/40 hover:border-muted-foreground/40 hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground/60 transition-all"
        >
          <GithubIcon size={20} className="text-foreground group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
            GitHub
          </span>
        </a>

        <a
          href="https://github.com/sponsors/ek33450505"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sponsor Edward's open source work on GitHub (opens in new tab)"
          className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 bg-card/40 hover:border-terra/40 hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra/60 transition-all"
        >
          <Heart size={20} className="text-terra group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase">
            Sponsor
          </span>
        </a>
      </div>

      <div className="mt-6 pt-6 border-t border-border/60 text-center">
        <a
          href="mailto:edward.kubiak.dev@gmail.com"
          className="inline-flex items-center gap-2 font-mono text-sm sm:text-base text-primary hover:text-primary transition-colors group"
        >
          edward.kubiak.dev@gmail.com
          <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
        </a>
      </div>
    </Reveal>
  );
}
