"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, db } from "@/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; 
import { getTranslation } from "@/lib/translations";
import { Eye, EyeOff, Loader2, Check, X, Github } from "lucide-react";
import Link from "next/link";

export function AuthForm({ type }: { type: "login" | "signup" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [lang, setLang] = useState("en");
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setLang(savedLang);
  }, []);

  const t = getTranslation(lang);

  const formSchema = z.object({
    name: type === "signup" && !isResetMode ? z.string().min(2, t.errNameEmpty) : z.string().optional(),
    email: z.string().email(t.errEmailInvalid),
    password: isResetMode 
      ? z.string().optional() 
      : type === "signup"
        ? z.string()
            .min(8, t.passRuleLength)
            .regex(/[A-Z]/, t.passRuleUpper)
            .regex(/[a-z]/, t.passRuleLower)
            .regex(/[0-9]/, t.passRuleNumber)
        : z.string().min(6, t.errPasswordShort),
    confirmPassword: (type === "signup" && !isResetMode) ? z.string().optional() : z.string().optional(),
  }).refine((data) => {
    if (type === "signup" && !isResetMode) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: t.errPasswordsNotMatch,
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const watchPassword = form.watch("password") || "";
  
  const passwordRules = [
    { id: "length", label: t.passRuleLength, met: watchPassword.length >= 8 },
    { id: "upper", label: t.passRuleUpper, met: /[A-Z]/.test(watchPassword) },
    { id: "lower", label: t.passRuleLower, met: /[a-z]/.test(watchPassword) },
    { id: "number", label: t.passRuleNumber, met: /[0-9]/.test(watchPassword) },
  ];

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || "User",
          createdAt: new Date().toISOString()
        });
      }

      document.cookie = "isAuth=true; path=/; max-age=31536000; SameSite=Lax";
      toast.success(t.loginSuccess);
      router.push("/profile");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/account-exists-with-different-credential') {
        toast.error(t.errAccountExists || "Этот Email уже привязан к другому способу входа.");
      } else if (errorCode !== 'auth/popup-closed-by-user') {
        toast.error(t.errUnknown);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || "User",
          createdAt: new Date().toISOString()
        });
      }

      document.cookie = "isAuth=true; path=/; max-age=31536000; SameSite=Lax";
      toast.success(t.loginSuccess);
      router.push("/profile");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/account-exists-with-different-credential') {
        toast.error(t.errAccountExists || "Этот Email уже привязан к другому способу входа.");
      } else if (errorCode !== 'auth/popup-closed-by-user') {
        toast.error(t.errUnknown);
      }
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email || !email.includes("@")) {
      form.setError("email", { message: t.errEmailInvalid });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t.resetSent);
      setIsResetMode(false);
    } catch {
      toast.error(t.errUnknown);
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isResetMode) {
      return handlePasswordReset();
    }

    setIsLoading(true);
    try {
      if (type === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
        const user = userCredential.user;
        
        // Update Firebase profile with Name
        if (values.name) {
          await updateProfile(user, { displayName: values.name });
        }
        
        // Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: values.name || "User",
          createdAt: new Date().toISOString()
        });
        
        toast.success(t.regSuccess);
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password!);
        toast.success(t.loginSuccess);
      }

      document.cookie = "isAuth=true; path=/; max-age=31536000; SameSite=Lax";
      router.push("/profile");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      const errorCode = (error as { code?: string }).code;
      
      if (errorCode === 'auth/email-already-in-use') {
        toast.error(t.errEmailInUse);
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        toast.error(t.errInvalidCredentials);
      } else if (errorCode === 'auth/weak-password') {
        toast.error(t.errWeakPassword);
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error(t.errTooManyRequests);
      } else {
        toast.error(t.errUnknown);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Determine Title
  const title = isResetMode 
    ? t.forgotPassword 
    : type === "login" 
      ? t.loginTitle 
      : t.signupTitle;

  // Determine Main Button text
  const submitText = isResetMode 
    ? t.resetBtn 
    : type === "login" 
      ? t.login 
      : t.signup;

  return (
    <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 border border-border/50 p-6 md:p-8 rounded-3xl bg-card/60 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-space-grotesk">{title}</h2>
          </div>

          {/* Google Auth Button */}
          {!isResetMode && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full font-semibold relative h-12 rounded-xl bg-background hover:bg-secondary/50 border-border/60 transition-all group"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {t.continueGoogle}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full font-semibold relative h-12 rounded-xl bg-background hover:bg-secondary/50 border-border/60 transition-all group"
                onClick={handleGithubSignIn}
                disabled={isGoogleLoading || isGithubLoading || isLoading}
              >
                {isGithubLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Github className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                )}
                {t.continueGithub || "Продолжить с GitHub"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-semibold">
                    {t.orWithEmail}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Name Field (Signup Only) */}
          {type === "signup" && !isResetMode && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-secondary-foreground font-bold">{t.fullName}</FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-background focus:ring-primary/50" placeholder={t.fullNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-secondary-foreground font-bold">{t.email}</FormLabel>
                <FormControl>
                  <Input className="h-12 rounded-xl bg-background focus:ring-primary/50" type="email" placeholder={t.emailPlaceholder} {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Password Field (Hidden in Reset Mode) */}
          {isResetMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500/90 text-xs px-3 py-2.5 rounded-xl font-medium flex items-start gap-2">
              <span className="shrink-0 text-amber-500 mt-0.5">⚠️</span>
              {t.checkSpamWarning}
            </div>
          )}

          {!isResetMode && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-secondary-foreground font-bold">{t.password}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        className="h-12 rounded-xl bg-background focus:ring-primary/50 pr-12" 
                        type={showPassword ? "text" : "password"} 
                        placeholder={t.passwordPlaceholder} 
                        {...field} 
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
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Strict Password Rules Indicator (Signup Only) */}
          {type === "signup" && !isResetMode && (
            <div className="space-y-2 mt-2 bg-secondary/30 p-3 rounded-xl border border-border/50 text-xs">
              {passwordRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 transition-colors duration-300">
                  {rule.met ? (
                    <div className="bg-green-500/20 p-0.5 rounded-full">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                  ) : (
                    <div className="bg-muted p-0.5 rounded-full">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className={rule.met ? "text-green-500 font-medium" : "text-muted-foreground"}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Password Field (Signup Only) */}
          {type === "signup" && !isResetMode && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-secondary-foreground font-bold">{t.confirmPassword}</FormLabel>
                  <FormControl>
                    <Input 
                      className="h-12 rounded-xl bg-background focus:ring-primary/50" 
                      type={showPassword ? "text" : "password"} 
                      placeholder={t.confirmPasswordPlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Forgot Password Link (Login Only) */}
          {type === "login" && !isResetMode && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-sm text-primary hover:underline hover:text-primary/80 font-semibold"
              >
                {t.forgotPassword}
              </button>
            </div>
          )}

          {/* Back to Login Link (Reset Mode Only) */}
          {isResetMode && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-sm text-muted-foreground hover:underline font-semibold"
              >
                {lang === 'en' ? 'Back to login' : lang === 'uk' ? 'Повернутися до входу' : 'Вернуться ко входу'}
              </button>
            </div>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow" disabled={isLoading || isGoogleLoading || isGithubLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isLoading ? t.loading : submitText}
          </Button>
        </form>
      </Form>

      {/* Switcher at the bottom */}
      {!isResetMode && (
        <div className="text-center">
          <Link 
            href={type === "login" ? "/signup" : "/login"} 
            className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            {type === "login" ? t.noAccount : t.haveAccount}
          </Link>
        </div>
      )}
    </div>
  );
}
