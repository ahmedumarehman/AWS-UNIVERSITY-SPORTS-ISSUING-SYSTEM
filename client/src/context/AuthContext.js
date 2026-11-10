import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState("signed_out");
  const [mfaError, setMfaError] = useState("");

  // Only trusted Supabase app_metadata determines administrator access.
  const isAdmin = user?.app_metadata?.role === "admin";

  const refreshMfaState = useCallback(async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      setMfaStatus("signed_out");
      setMfaError("");
      return "signed_out";
    }

    const [
      { data: factorsData, error: factorsError },
      { data: aalData, error: aalError },
    ] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

    if (factorsError) throw factorsError;
    if (aalError) throw aalError;

    const verifiedTotpFactors = (factorsData?.totp ?? []).filter(
      (factor) => factor.status === "verified",
    );

    let nextStatus;

    if (aalData?.currentLevel === "aal2") {
      nextStatus = "verified";
    } else if (verifiedTotpFactors.length > 0) {
      nextStatus = "verification_required";
    } else {
      nextStatus = "enrollment_required";
    }

    setMfaStatus(nextStatus);
    setMfaError("");
    return nextStatus;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;
        if (error)
          console.error("Session initialization error:", error.message);

        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
      } catch (error) {
        console.error("Authentication initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Keep MFA state in sync with the active session. Do not call Supabase APIs
  // inside onAuthStateChange; this effect runs after the auth callback.
  useEffect(() => {
    let active = true;

    const updateMfa = async () => {
      if (!session) {
        setMfaStatus("signed_out");
        setMfaError("");
        setMfaLoading(false);
        return;
      }

      setMfaLoading(true);

      try {
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const { data: aalData, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        if (!active) return;

        const verifiedTotpFactors = (factorsData?.totp ?? []).filter(
          (factor) => factor.status === "verified",
        );

        if (aalData?.currentLevel === "aal2") {
          setMfaStatus("verified");
        } else if (verifiedTotpFactors.length > 0) {
          setMfaStatus("verification_required");
        } else {
          setMfaStatus("enrollment_required");
        }

        setMfaError("");
      } catch (error) {
        if (!active) return;
        console.error("MFA status check failed:", error);
        setMfaError(error.message || "Unable to check MFA status.");
        setMfaStatus("error");
      } finally {
        if (active) setMfaLoading(false);
      }
    };

    updateMfa();

    return () => {
      active = false;
    };
  }, [session]);

  const signUp = async (fullName, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading,
    isAdmin,
    mfaLoading,
    mfaStatus,
    mfaError,
    refreshMfaState,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
