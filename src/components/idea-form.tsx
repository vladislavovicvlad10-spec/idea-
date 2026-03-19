import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Lock } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { useAuth } from "@/firebase/provider";
import { toast } from "sonner";

interface IdeaFormProps {
  onGenerate: (theme: string) => Promise<void>;
  isLoading: boolean;
}

export function IdeaForm({ onGenerate, isLoading }: IdeaFormProps) {
  const [theme, setTheme] = useState("");
  const { t } = useLang();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    
    if (!user) {
      toast.error(t.authRequired, {
        icon: <Lock className="h-4 w-4" />,
      });
      return;
    }

    await onGenerate(theme);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative group">
        <Textarea
          placeholder={user ? t.placeholder : t.authRequired}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[140px] text-lg p-6 pr-16 shadow-2xl bg-card border-2 border-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-3xl resize-none"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon"
          title={user ? t.generate : t.authRequired}
          className="absolute bottom-5 right-5 h-12 w-12 rounded-full transition-transform hover:scale-105 shadow-md shadow-primary/20"
          disabled={isLoading || !theme.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
             user ? <Sparkles className="h-6 w-6" /> : <Lock className="h-6 w-6 text-muted-foreground" />
          )}
        </Button>
      </div>
    </form>
  );
}
