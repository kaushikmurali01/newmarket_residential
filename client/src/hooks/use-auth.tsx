import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
};

// Global state to persist across hot reloads
let globalAuthState: User | null = null;
let globalIsLoading = true;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(globalAuthState);
  const [isLoading, setIsLoading] = useState(globalIsLoading);

  // Sync with global state
  useEffect(() => {
    globalAuthState = user;
  }, [user]);

  useEffect(() => {
    globalIsLoading = isLoading;
  }, [isLoading]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          globalAuthState = userData;
        } else {
          setUser(null);
          globalAuthState = null;
        }
      } catch (error) {
        setUser(null);
        globalAuthState = null;
      } finally {
        setIsLoading(false);
        globalIsLoading = false;
      }
    };

    // Only check if we don't have cached user data
    if (!globalAuthState) {
      checkAuth();
    } else {
      // We have cached data, verify it's still valid
      setUser(globalAuthState);
      setIsLoading(false);
      checkAuth(); // Still verify in background
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      globalAuthState = userData;
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.firstName || userData.username}`,
      });
      // Use setTimeout to ensure state is updated before redirect
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setUser(null);
      globalAuthState = null;
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}