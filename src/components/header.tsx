"use client";

import Link from "next/link";
import { useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Button } from "./ui/button";
import { Flame } from "lucide-react";
import { getTranslation } from "@/lib/translations";
import { useEffect, useState } from "react";

export function Header() {
  const { user, loading } = useAuth();
  const [lang, setLang] = useState("ru");

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) {
      setTimeout(() => setLang(savedLang), 0);
    }
  }, []);

  const t = getTranslation(lang);
  const isAdmin = user?.email === "gonv0791@gmail.com";

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8 mx-auto justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Flame className="h-6 w-6 text-primary" />
          <span className="font-bold font-space-grotesk text-xl text-primary">
            {lang === 'en' ? 'IdeaSpark' : lang === 'uk' ? 'ІскраІдей' : 'ИскраИдей'}
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/bookmarks">
                      <Button variant="ghost" size="sm" className="hidden sm:inline-flex">{t.bookmarks}</Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">{t.dashboard}</Button>
                      </Link>
                    )}
                    <Link href="/profile">
                      <Button variant="ghost" size="sm">{t.profile}</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="border-primary/20 hover:bg-primary/5">{t.logout}</Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">{t.login}</Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" className="font-semibold">{t.signup}</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
