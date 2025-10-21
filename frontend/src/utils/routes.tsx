import { createContext, useContext, useState, ReactNode } from "react";

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: "/",
  navigate: () => {},
});

export function useRouter() {
  return useContext(RouterContext);
}

export function Router({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState("/");

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
