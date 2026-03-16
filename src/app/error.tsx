"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] px-4 animate-in fade-in duration-500">
      <div className="bg-destructive/10 p-4 rounded-full mb-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold font-space-grotesk tracking-tight text-center mb-4">
        Ой! Что-то пошло не так
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Мы столкнулись с непредвиденной ошибкой. Пожалуйста, попробуйте снова или вернитесь на главную.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()} variant="default" size="lg">
          Попробовать снова
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline" size="lg">
          На главную
        </Button>
      </div>
    </div>
  );
}
