import { motion } from "motion/react";
import { ExternalLink, Mic, Headphones, FileText, Play } from "lucide-react";
import { fadeUp } from "../utils/motion";
import talks from "../data/talks";
import SectionHeader from "./ui/SectionHeader";
import PageWrapper from "./ui/PageWrapper";

const typeConfig = {
  talk: { icon: Mic, label: "Talk", color: "text-amber-400 bg-amber-400/10" },
  podcast: { icon: Headphones, label: "Podcast", color: "text-sky-400 bg-sky-400/10" },
  article: { icon: FileText, label: "Article", color: "text-violet-400 bg-violet-400/10" },
  demo: { icon: Play, label: "Demo", color: "text-emerald-400 bg-emerald-400/10" },
};

function TalkCard({ talk, index }) {
  const config = typeConfig[talk.type] || typeConfig.talk;
  const Icon = config.icon;

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm hover:border-amber-400/30 hover:bg-slate-800/40 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.color} shrink-0 mt-0.5`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display text-[10px] tracking-wider uppercase text-slate-400">
              {config.label}
            </span>
            {talk.event && (
              <>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <span className="font-display text-[10px] tracking-wider text-slate-600">
                  {talk.event}
                </span>
              </>
            )}
            {talk.date && (
              <>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <time
                  dateTime={talk.date}
                  className="font-display text-[10px] tracking-wider text-slate-600"
                >
                  {new Date(talk.date + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </time>
              </>
            )}
          </div>

          <h3 className="font-display text-sm font-bold tracking-wide text-slate-100 mb-2">
            {talk.title}
          </h3>

          {talk.description && (
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              {talk.description}
            </p>
          )}

          {talk.youtubeId && (
            <div
              className="mt-4 mb-3 rounded-lg overflow-hidden aspect-video"
              style={{ maxWidth: "480px" }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${talk.youtubeId}`}
                title={talk.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          )}

          {talk.url && (
            <a
              href={talk.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${talk.title} (opens in new tab)`}
              className="inline-flex items-center gap-1 font-display text-[11px] tracking-wider uppercase text-amber-400 hover:text-amber-300 transition-colors"
            >
              View
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

const Talks = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <SectionHeader
            as="h1"
            headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            underlineClassName="mt-3"
            title={<>Talks & <span className="text-amber-400">Writing</span></>}
          />
          <p className="mt-4 text-slate-400 leading-relaxed max-w-xl">
            Conference talks, podcast appearances, demos, and articles. More
            writing on{" "}
            <a
              href="https://dev.to/edwardkubiak"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-400/30 transition-colors"
            >
              Dev.to
            </a>
            .
          </p>
        </motion.div>

        {/* Talk cards */}
        <div className="mt-12 space-y-4">
          {talks.length > 0 ? (
            talks.map((talk, i) => (
              <TalkCard key={`${talk.title}-${i}`} talk={talk} index={i} />
            ))
          ) : null}
        </div>

        {/* Empty / coming soon state */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 p-6 rounded-xl border border-slate-800/40 bg-slate-900/20 text-center"
        >
          <p className="text-sm text-slate-400">
            More coming soon &mdash;{" "}
            <a
              href="https://dev.to/edwardkubiak"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors"
              aria-label="Check Dev.to for writing (opens in new tab)"
            >
              check Dev.to for writing
            </a>
            .
          </p>
        </motion.div>
      </PageWrapper>
    </div>
  );
};

export default Talks;
