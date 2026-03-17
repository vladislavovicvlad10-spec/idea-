"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { getTranslation } from "./translations";

type LangContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: ReturnType<typeof getTranslation>;
};

const LangContext = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  t: getTranslation("ru"),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_lang") || "ru";
    }
    return "ru";
  });

  const setLang = (newLang: string) => {
    localStorage.setItem("app_lang", newLang);
    setLangState(newLang);
    window.location.reload();
  };

  const t = getTranslation(lang);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
