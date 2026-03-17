"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getTranslation } from "@/lib/translations";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [lang, setLang] = useState("en");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setLang(savedLang);
  }, []);

  const t = getTranslation(lang);
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  if (!oobCode || mode !== "resetPassword") {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 font-medium">{t.resetError}</p>
        <Link href="/login">
          <Button variant="outline">Вернуться ко входу</Button>
        </Link>
      </div>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t.errPasswordShort);
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success(t.resetSuccess);
      router.push("/login");
    } catch {
      setIsError(true);
      toast.error(t.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <form onSubmit={handleReset} className="space-y-5 border border-border/50 p-6 md:p-8 rounded-3xl bg-card/60 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-space-grotesk">{t.newPasswordLabel}</h2>
        </div>

        {isError ? (
          <div className="text-center space-y-4">
            <p className="text-red-500 font-medium text-sm">{t.resetError}</p>
            <Link href="/login" className="block">
              <Button type="button" variant="outline" className="w-full">Вернуться ко входу</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm text-secondary-foreground font-bold">{t.newPasswordLabel}</label>
              <div className="relative">
                <Input 
                  className="h-12 rounded-xl bg-background focus:ring-primary/50 pr-12" 
                  type={showPassword ? "text" : "password"} 
                  placeholder={t.passwordPlaceholder} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {t.setNewPasswordBtn}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
