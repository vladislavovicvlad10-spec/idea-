"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase";
import { setDoc, doc } from "firebase/firestore";
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

const formSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export function AuthForm({ type }: { type: "login" | "signup" }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (type === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date().toISOString()
        });
        
        toast.success("Регистрация успешна!");
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast.success("Вход успешен!");
      }

      // Устанавливаем куку немедленно, чтобы прокси (middleware) пустил нас дальше
      document.cookie = "isAuth=true; path=/; max-age=31536000; SameSite=Lax";
      
      router.push("/profile");
      router.refresh(); // Принудительно обновляем состояние маршрутов
    } catch (error: unknown) {
      console.error(error);
      const errorCode = (error as { code?: string }).code;
      
      if (errorCode === 'auth/email-already-in-use') {
        toast.error("Этот email уже зарегистрирован. Пожалуйста, войдите в аккаунт.");
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        toast.error("Неверный email или пароль.");
      } else if (errorCode === 'auth/weak-password') {
        toast.error("Пароль слишком простой. Придумайте минимум 6 символов.");
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error("Слишком много попыток входа. Попробуйте позже.");
      } else {
        toast.error("Произошла ошибка. Проверьте данные и попробуйте снова.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm border border-border p-6 rounded-2xl bg-card shadow-xl">
        <h2 className="text-2xl font-bold font-space-grotesk text-center">
          {type === "login" ? "Вход в аккаунт" : "Новый аккаунт"}
        </h2>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isLoading}>
          {isLoading ? "Загрузка..." : type === "login" ? "Войти" : "Зарегистрироваться"}
        </Button>
      </form>
    </Form>
  );
}
