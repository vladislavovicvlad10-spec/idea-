"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Bookmark, Calendar, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTranslation } from "@/lib/translations";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ savedCount: 0 });
  const [lang, setLang] = useState("ru");
  const router = useRouter();

  useEffect(() => {
    const activeLang = localStorage.getItem("app_lang");
    if (activeLang) {
      setTimeout(() => setLang(activeLang), 0);
    }
  }, []);

  const t = getTranslation(lang);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchStats = async () => {
        const snapshot = await getDocs(collection(db, "users", user.uid, "bookmarks"));
        setStats({ savedCount: snapshot.size });
      };
      fetchStats();
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-primary">{t.profile}</h1>
          <p className="text-muted-foreground">{t.manageAccount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">{t.personalData}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t.registrationDate}</p>
                <p className="font-medium">March 16, 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-inner">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              {t.stats}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-primary mb-1">{stats.savedCount}</p>
              <p className="text-sm text-muted-foreground">{t.savedIdeas}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
