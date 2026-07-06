import { Star } from "lucide-react";
import { useGitHubStars } from "../../hooks/useGitHubStars";

/**
 * StarBadge — shows a GitHub star count pill for a given owner/repo.
 * Returns null while loading or when star count is unavailable.
 */
export default function StarBadge({ owner, repo }) {
  const { stars, loading } = useGitHubStars(owner, repo);
  if (loading || stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider bg-primary/10 text-primary border border-primary/20">
      <Star size={10} aria-hidden="true" className="fill-primary" />
      {stars}
    </span>
  );
}
