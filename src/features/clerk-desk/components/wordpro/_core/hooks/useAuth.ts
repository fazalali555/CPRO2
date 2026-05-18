import { useCallback, useMemo } from "react";

export function useAuth() {
  const state = useMemo(() => {
    return {
      user: { id: 1, name: "Clerk User", email: "clerk@example.com" },
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);

  const logout = useCallback(async () => {
    console.log("Mock logout");
  }, []);

  return {
    ...state,
    refresh: () => {},
    logout,
  };
}
