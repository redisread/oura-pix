"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setSession(data as Session);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { session, loading };
}

export function useUser() {
  const { session, loading } = useSession();
  return { user: session?.user || null, loading };
}
