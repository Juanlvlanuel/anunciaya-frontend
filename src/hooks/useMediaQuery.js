import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const getMatches = (query) => window.matchMedia(query).matches;

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

