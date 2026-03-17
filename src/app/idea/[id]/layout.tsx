import type { Metadata } from 'next';
import { getSharedIdea } from '../actions';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const idea = await getSharedIdea(params.id);

  if (!idea) {
    return {
      title: 'Idea Not Found | IdeaSpark',
      description: 'This idea could not be found or has been removed.',
    };
  }

  const desc = idea.description.length > 150 ? idea.description.slice(0, 147) + '...' : idea.description;

  return {
    title: `${idea.name} | IdeaSpark`,
    description: desc,
    openGraph: {
      title: `${idea.name} - A new startup idea by IdeaSpark`,
      description: desc,
      type: "article",
      siteName: "IdeaSpark",
    },
    twitter: {
      card: "summary_large_image",
      title: idea.name,
      description: desc,
    }
  };
}

export default function IdeaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
