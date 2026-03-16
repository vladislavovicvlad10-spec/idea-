import { Idea, IdeaCard } from "./idea-card";

export function IdeaList({ ideas }: { ideas: Idea[] }) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto py-8">
      {ideas.map((idea, idx) => (
        <div key={idx} style={{ animationDelay: `${idx * 150}ms` }} className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
          <IdeaCard idea={idea} />
        </div>
      ))}
    </div>
  );
}
