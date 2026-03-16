"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Idea, IdeaCard } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Idea[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchBookmarks = async () => {
        try {
          const q = query(
            collection(db, "users", user.uid, "bookmarks"),
            orderBy("savedAt", "desc")
          );
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Idea));
          setBookmarks(data);
        } catch (error) {
          console.error("Error fetching bookmarks:", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchBookmarks();
    }
  }, [user, loading, router]);

  if (loading || isFetching) {
    return (
      <div className="container mx-auto max-w-7xl py-12 px-4">
        <h1 className="text-3xl font-bold font-space-grotesk mb-8 text-primary">Мои сохраненные идеи</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <h1 className="text-3xl font-bold font-space-grotesk mb-8 text-primary">Мои сохраненные идеи</h1>
      
      {bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
          <p className="text-xl text-muted-foreground mb-4">У вас пока нет сохраненных идей.</p>
          <p className="text-sm text-muted-foreground">Начните генерировать идеи на главной странице!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
          {bookmarks.map((idea) => (
            <IdeaCard key={idea.id || idea.name} idea={idea} saved={true} />
          ))}
        </div>
      )}
    </div>
  );
}
