"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTranslation } from "./translations";

type LangContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: ReturnType<typeof getTranslation>;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: getTranslation("en"),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      const storedLang = localStorage.getItem("app_lang");
      if (storedLang) {
        setLangState(storedLang);
        document.documentElement.lang = storedLang;
      } else {
        localStorage.setItem("app_lang", "en");
        document.documentElement.lang = "en";
      }
    }, 0);
  }, []);

  const setLang = (newLang: string) => {
    localStorage.setItem("app_lang", newLang);
    setLangState(newLang);
    window.location.reload();
  };

  const t = getTranslation(lang);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {isMounted ? children : <div className="min-h-screen" style={{ visibility: "hidden" }}>{children}</div>}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
