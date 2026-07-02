import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { timeAgo } from "../../utils/timeAgo";
import SectionHeader from "../ui/SectionHeader";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";

export default function RecentWriting() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/devto-feed.json")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (!cancelled) {
          setArticles(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || articles.length === 0) return null;

  return (
    <PageWrapper width="6xl" className="pb-20 w-full relative z-[2]">
    <Reveal as="section" aria-labelledby="recent-writing-heading">
      <div className="mb-6">
        <SectionHeader id="recent-writing-heading" title="Recent Writing" />
      </div>

      <div className="space-y-2">
        {articles.map((article, i) => (
          <motion.a
            key={article.url}
            href={article.url?.startsWith('https://') ? article.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="group flex items-start gap-3 p-4 card-interactive block"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-slate-200 group-hover:text-accent-400 transition-colors leading-snug">
                {article.title}
              </p>
              {article.description && (
                <p className="text-xs text-slate-400 leading-snug mt-1 truncate">
                  {article.description}
                </p>
              )}
              {(article.reactions > 0 || article.views > 0) && (
                <p className="text-xs text-slate-400 leading-snug mt-1">
                  ★ {article.reactions} reactions · {article.views} views
                </p>
              )}
            </div>
            <span className="font-display text-[11px] tracking-wider text-slate-400 shrink-0 pt-0.5">
              {timeAgo(article.published_at)}
            </span>
          </motion.a>
        ))}
      </div>
    </Reveal>
    </PageWrapper>
  );
}
