"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { db, auth } from "@/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { signOut, updateProfile, deleteUser, sendPasswordResetEmail } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bookmark, Calendar, Mail, LogOut, Globe, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTranslation } from "@/lib/translations";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ savedCount: 0 });
  const [lang, setLang] = useState("en");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      document.cookie = "isAuth=; path=/; max-age=0";
      router.push("/login");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(t.passResetSentProfile);
    } catch {
      toast.error(t.errUnknown);
    }
  };

  const handleLangChange = (newLang: string) => {
    localStorage.setItem("app_lang", newLang);
    toast.success(t.changeLanguage + "...");
    setTimeout(() => window.location.reload(), 500);
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateProfile(user, { displayName: newName.trim() });
      await updateDoc(doc(db, "users", user.uid), { name: newName.trim() });
      setIsEditingName(false);
      toast.success(t.nameUpdated || "Name updated!");
    } catch (error) {
      console.error(error);
      toast.error(t.errUnknown);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      document.cookie = "isAuth=; path=/; max-age=0";
      toast.success(t.accountDeleted || "Account deleted.");
      router.push("/login");
    } catch (error: unknown) {
      console.error(error);
      if ((error as { code?: string })?.code === "auth/requires-recent-login") {
        toast.error("В целях безопасности необходимо перевойти в аккаунт перед удалением.");
      } else {
        toast.error(t.errUnknown);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return null;

  const registrationDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(
        lang === 'en' ? 'en-US' : lang === 'uk' ? 'uk-UA' : 'ru-RU',
        { month: 'long', day: 'numeric', year: 'numeric' }
      )
    : "—";

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-2xl font-black font-space-grotesk text-white">
                {user?.displayName?.[0] || user?.email?.[0].toUpperCase() || "U"}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk text-primary">
              {user?.displayName ? user.displayName : t.profile}
            </h1>
            <p className="text-muted-foreground text-sm">{t.manageAccount}</p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="flex items-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300 transition-all"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Data */}
        <Card className="md:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t.personalData}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Email</p>
                <p className="font-medium text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{t.registrationDate}</p>
                <p className="font-medium text-sm">{registrationDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl border border-border/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{t.editName?.split(" ")[1] || "Name"}</p>
                  {isEditingName ? (
                    <input 
                      type="text"
                      className="bg-background border rounded px-2 py-1 text-sm outline-none focus:border-primary font-medium"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium text-sm">{user?.displayName || "—"}</p>
                  )}
                </div>
                {isEditingName ? (
                  <Button size="sm" onClick={handleSaveName}>{t.saveName || "Save"}</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(true); setNewName(user?.displayName || ""); }}>{t.editName || "Edit"}</Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button 
                variant="outline" 
                className="w-full font-medium"
                onClick={handleChangePassword}
              >
                {t.changePassword}
              </Button>
              <Button 
                variant="destructive" 
                className="w-full font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                onClick={() => setShowDeleteModal(true)}
              >
                {t.deleteAccount || "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-primary/5 border-primary/20 shadow-inner">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              {t.stats}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-primary mb-2 font-space-grotesk">{stats.savedCount}</p>
              <p className="text-sm text-muted-foreground">{t.savedIdeas}</p>
            </div>
          </CardContent>
        </Card>

        {/* Language Switcher */}
        <Card className="md:col-span-3 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              {t.languageLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {LANGUAGES.map((l) => {
                const isActive = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => !isActive && handleLangChange(l.code)}
                    className={`
                      relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-left group
                      ${isActive
                        ? "border-primary/60 bg-primary/10 shadow-[0_0_20px_rgba(200,80,250,0.15)]"
                        : "border-border/40 bg-secondary/20 hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                      }
                    `}
                  >
                    <span className={`text-3xl transition-all duration-300 ${isActive ? '' : 'filter grayscale group-hover:grayscale-0'}`}>
                      {l.flag}
                    </span>
                    <span className={`font-medium text-sm font-space-grotesk ${isActive ? 'text-primary' : 'text-foreground/70'}`}>
                      {l.label}
                    </span>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col gap-5 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-2 items-center text-center">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-space-grotesk text-foreground">{t.deleteAccount || "Delete Account"}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                {t.confirmDelete || "Are you sure? This action is irreversible."}
              </p>
            </div>
            
            <div className="flex gap-3 justify-center w-full mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 font-medium"
              >
                {lang === 'ru' ? 'Отмена' : lang === 'uk' ? 'Скасувати' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-500 hover:bg-red-600 text-white flex-1 font-medium shadow-lg shadow-red-500/20"
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {lang === 'ru' ? 'Да, удалить' : lang === 'uk' ? 'Так, видалити' : 'Yes, delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
