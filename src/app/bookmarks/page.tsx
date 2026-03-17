"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Idea, IdeaCard } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { getTranslation } from "@/lib/translations";
import { Bookmark, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Idea[]>([]);
  const [filtered, setFiltered] = useState<Idea[]>([]);
  const [search, setSearch] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [lang, setLang] = useState("en");
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setLang(savedLang);
  }, []);

  const t = getTranslation(lang);

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
          const data = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as Idea));
          setBookmarks(data);
          setFiltered(data);
        } catch (error) {
          console.error("Error fetching bookmarks:", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchBookmarks();
    }
  }, [user, loading, router]);

  // Live search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(bookmarks);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      bookmarks.filter(
        idea =>
          idea.name.toLowerCase().includes(q) ||
          idea.description.toLowerCase().includes(q) ||
          idea.features.some(f => f.toLowerCase().includes(q))
      )
    );
  }, [search, bookmarks]);

  if (loading || isFetching) {
    return (
      <div className="container mx-auto max-w-7xl py-12 px-4">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <Skeleton className="h-11 w-full mb-8 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const searchLabel = lang === 'en' ? 'Search ideas...' : lang === 'uk' ? 'Пошук ідей...' : 'Поиск идей...';
  const noResultsLabel = lang === 'en' ? 'Nothing found' : lang === 'uk' ? 'Нічого не знайдено' : 'Ничего не найдено';

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Bookmark className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-primary">{t.myBookmarks}</h1>
          <p className="text-sm text-muted-foreground">{bookmarks.length} {t.savedIdeas.toLowerCase()}</p>
        </div>
      </div>

      {/* Search bar — only show if there are bookmarks */}
      {bookmarks.length > 0 && (
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchLabel}
            className="pl-9 pr-9 h-11 rounded-xl bg-card/50 border-border/50 focus:border-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-24 bg-secondary/20 rounded-3xl border border-dashed border-border">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground mb-2">{t.noBookmarks}</p>
          <p className="text-sm text-muted-foreground/60">{t.startGenerating}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-secondary/20 rounded-3xl border border-dashed border-border">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">{noResultsLabel}</p>
          <p className="text-xs text-muted-foreground/50 mt-2">«{search}»</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id || idea.name} idea={idea} saved={true} />
          ))}
        </div>
      )}
    </div>
  );
}
