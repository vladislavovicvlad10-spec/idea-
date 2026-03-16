"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Lightbulb, TrendingUp, Clock, Search, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranslation } from "@/lib/translations";

interface ActivityAction {
  id: string;
  type?: string;
  theme?: string;
  count?: number;
  lang?: string;
  timestamp?: Timestamp | Date;
}

interface UserData {
  id: string;
  email: string;
  createdAt: string;
}

interface TopicStat {
  label: string;
  count: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIdeas: 0,
    recentActions: [] as ActivityAction[],
    recentUsers: [] as UserData[],
    topTopics: [] as TopicStat[],
    langDistribution: { ru: 0, en: 0, uk: 0 },
    conversionRate: 0
  });
  const [isFetching, setIsFetching] = useState(true);
  const [lang, setLang] = useState("ru");

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) {
      setTimeout(() => setLang(savedLang), 0);
    }
  }, []);

  const t = getTranslation(lang);

  useEffect(() => {
    if (!loading && (!user || user.email !== "gonv0791@gmail.com")) {
      router.push("/");
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          // 1. Fetch Users
          const usersSnap = await getDocs(collection(db, "users"));
          
          // 2. Fetch Recent Logins/Users
          const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
          const recentUsersSnap = await getDocs(recentUsersQuery);
          const recentUsers = recentUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
          
          // 3. Fetch All Activity for aggregation
          const [allActivitySnap] = await Promise.all([
            getDocs(collection(db, "activity_logs")),
          ]);
          
          let totalIdeas = 0;
          const themes: Record<string, number> = {};
          const langs: Record<string, number> = { ru: 0, en: 0, uk: 0 };
          
          allActivitySnap.forEach(doc => {
            const data = doc.data();
            totalIdeas += (data.count || 0);
            
            // Theme aggregation
            if (data.theme) {
                const term = data.theme.trim().toLowerCase();
                themes[term] = (themes[term] || 0) + 1;
            }

            // Language aggregation
            if (data.lang && langs.hasOwnProperty(data.lang)) {
                langs[data.lang as keyof typeof langs]++;
            } else if (!data.lang) {
                langs.ru++; // Default for old logs
            }
          });

          // 4. Calculate Top Topics
          const topTopics = Object.entries(themes)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          // 5. Recent Actions
          const activityQuery = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(6));
          const activitySnap = await getDocs(activityQuery);
          const actions = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityAction));

          // 6. Real Conversion (Users with bookmarks vs Total Users)
          // Since we can't easily query all subcollections, we use the ratio of activity to users as a proxy for "Engagement"
          const engagement = usersSnap.size > 0 ? (allActivitySnap.size / usersSnap.size) * 10 : 0;

          setStats({
            totalUsers: usersSnap.size,
            totalIdeas: totalIdeas,
            recentActions: actions,
            recentUsers: recentUsers,
            topTopics: topTopics,
            langDistribution: langs as { ru: number, en: number, uk: number },
            conversionRate: Math.min(Math.round(engagement), 100)
          });
        } catch (error) {
          console.error("Dashboard error:", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [user, loading, router]);

  if (loading || isFetching) return (
    <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
      <Skeleton className="h-20 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );

  const formatTime = (ts: Timestamp | Date | string | undefined) => {
    if (!ts) return "now";
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return lang === 'en' ? "just now" : "только что";
    if (diff < 60) return `${diff}m ${lang === 'en' ? 'ago' : 'назад'}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold font-space-grotesk text-primary mb-2">{t.adminPanel}</h1>
          <p className="text-muted-foreground text-lg">{t.realtimeStats}</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-primary">Live Connection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title={t.totalUsers}
          value={stats.totalUsers.toString()}
          icon={<Users className="w-5 h-5 text-blue-500" />}
          trend="Real-time"
        />
        <StatCard
          title={t.totalIdeas}
          value={stats.totalIdeas.toString()}
          icon={<Lightbulb className="w-5 h-5 text-yellow-500" />}
          trend="Atomic"
        />
        <StatCard
          title={t.activity24h}
          value={`${stats.recentActions.length}+`}
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          trend="Live"
        />
        <StatCard
          title={t.conversion}
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          trend="Engagement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t.recentActions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActions.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-secondary/10 border border-border/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                            {item.lang || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground truncate max-w-[200px] md:max-w-md">
                            {item.theme || 'System Action'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.count} items generated</p>
                        </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {t.recentUsers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(u.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-500" />
                        Languages
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LangBar label="Russian" count={stats.langDistribution.ru} total={stats.totalIdeas} color="bg-blue-500" />
                    <LangBar label="English" count={stats.langDistribution.en} total={stats.totalIdeas} color="bg-primary" />
                    <LangBar label="Ukrainian" count={stats.langDistribution.uk} total={stats.totalIdeas} color="bg-yellow-500" />
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="w-5 h-5 text-accent" />
                {t.topTopics}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 pt-2">
                {stats.topTopics.map((topic, i) => (
                  <TopicBar 
                    key={i} 
                    label={topic.label} 
                    percent={Math.round((topic.count / Math.max(stats.recentActions.length, 1)) * 100)} 
                    color={i === 0 ? "bg-primary" : i === 1 ? "bg-blue-500" : "bg-muted-foreground/30"} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20 p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-primary mb-1">Growth Mode</h4>
            <p className="text-[10px] text-muted-foreground">Monitoring all signals from the production database.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="bg-card/30 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-secondary/50 rounded-xl group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3 className="text-3xl font-bold font-space-grotesk mt-1">{value}</h3>
      </CardContent>
    </Card>
  );
}

function TopicBar({ label, percent, color }: { label: string, percent: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-foreground truncate max-w-[150px] capitalize">{label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-secondary/30 rounded-full">
        <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function LangBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium">
                <span>{label}</span>
                <span>{count} logs</span>
            </div>
            <div className="h-1 w-full bg-secondary/30 rounded-full">
                <div className={`${color} h-full rounded-full`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}
