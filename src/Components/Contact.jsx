import { motion } from "motion/react";
import { contact } from "../data/resume";
import { fadeUp } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import ContactForm from "./ui/ContactForm";

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
          Send a note about work, a project, or an idea. I read everything.
        </p>
        <div className="mt-5 h-px w-full bg-border" />
      </motion.div>

      <div className="mt-10">
        <ContactForm />
        <noscript>
          <p className="panel p-6 text-foreground">
            The contact form needs JavaScript. Reach me on{" "}
            <a href={`https://www.${contact.linkedin}`} className="text-primary underline">
              LinkedIn
            </a>
            .
          </p>
        </noscript>
      </div>
    </PageWrapper>
  </div>
);

export default Contact;
