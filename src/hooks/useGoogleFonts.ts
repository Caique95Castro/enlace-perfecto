import { useEffect } from "react";

const LOADED = new Set<string>();

/**
 * Injeta um <link> do Google Fonts para as famílias tipográficas informadas, uma única vez
 * por família (mesmo entre montagens diferentes do componente). Necessário porque cada
 * template de site pode usar uma combinação de fontes diferente, e apenas Cormorant Garamond
 * + Karla são pré-carregadas no <head> global do app.
 */
export function useGoogleFonts(families: (string | undefined | null)[]) {
  const key = families.filter(Boolean).join("|");

  useEffect(() => {
    const wanted = Array.from(new Set(families.filter((f): f is string => Boolean(f))));
    const toLoad = wanted.filter((f) => !LOADED.has(f));
    if (toLoad.length === 0) return;

    const href = `https://fonts.googleapis.com/css2?${toLoad
      .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`)
      .join("&")}&display=swap`;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    toLoad.forEach((f) => LOADED.add(f));

    // Não removemos o <link> ao desmontar: outra seção/página pode continuar usando a fonte,
    // e o navegador já cacheia o CSS, então deixá-lo carregado é inofensivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
