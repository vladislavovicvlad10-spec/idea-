"use client";

import Link from "next/link";
import { useAuth } from "@/firebase/provider";
import { Button } from "./ui/button";
import { Flame } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { useEffect, useState } from "react";

export function Header() {
  const { user, loading } = useAuth();
  const { lang, t } = useLang();
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin status server-side — email never exposed in client bundle
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const r = await fetch("/api/is-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await r.json();
        setIsAdmin(data.isAdmin ?? false);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);


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
                      <Button size="sm" className="font-semibold">{t.profile}</Button>
                    </Link>
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
