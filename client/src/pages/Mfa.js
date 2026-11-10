import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const Mfa = () => {
  const navigate = useNavigate();

  const {
    user,
    loading,
    mfaLoading,
    mfaStatus,
    mfaError,
    refreshMfaState,
    signOut,
    isAdmin,
  } = useAuth();

  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEnrollment = mfaStatus === "enrollment_required";
  const isStatusError = mfaStatus === "error";

  // Start TOTP enrollment safely.
  const startEnrollment = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    setQrCode("");
    setSecret("");
    setFactorId("");

    try {
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const totpFactors = factorsData?.totp ?? [];

      // If a verified authenticator already exists, use it.
      const verifiedFactor = totpFactors.find(
        (factor) => factor.status === "verified",
      );

      if (verifiedFactor) {
        await refreshMfaState();

        setNotice(
          "An authenticator is already registered. Enter its current six-digit code.",
        );

        return;
      }

      // Remove only unfinished TOTP factors.
      // Never remove an existing verified factor.
      const pendingFactors = totpFactors.filter(
        (factor) => factor.status !== "verified",
      );

      for (const factor of pendingFactors) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });

        if (unenrollError) {
          throw new Error(
            `Could not clear unfinished authenticator setup: ${unenrollError.message}`,
          );
        }
      }

      // Generate a unique friendly name to avoid duplicate-name errors.
      const friendlyName = `FAST Sports Portal ${Date.now()}`;

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (enrollError) throw enrollError;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);

      setNotice("Scan the new QR code with your authenticator app.");
    } catch (enrollmentError) {
      console.error("TOTP enrollment failed:", enrollmentError);

      setError(
        enrollmentError.message ||
          "Could not start authenticator setup. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading || (user && mfaLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p>Preparing your secure sign-in...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (mfaStatus === "verified") {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // Verify the authenticator code.
  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setBusy(true);

    try {
      let activeFactorId = factorId;

      if (isEnrollment) {
        // First-time enrollment uses the newly generated factor.
        if (!activeFactorId) {
          throw new Error(
            "Start authenticator setup first, then scan the QR code.",
          );
        }
      } else {
        // Existing accounts must verify their registered factor.
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) throw factorsError;

        const verifiedFactor = (factorsData?.totp ?? []).find(
          (factor) => factor.status === "verified",
        );

        if (!verifiedFactor) {
          throw new Error(
            "No verified authenticator was found. Please sign in again or contact the portal administrator.",
          );
        }

        activeFactorId = verifiedFactor.id;
      }

      // Create an MFA challenge.
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: activeFactorId,
        });

      if (challengeError) throw challengeError;

      // Verify the six-digit code.
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      // Confirm that the session has reached AAL2.
      const nextStatus = await refreshMfaState();

      if (nextStatus !== "verified") {
        throw new Error(
          "The code was accepted, but the session has not reached AAL2. Please sign in again and retry.",
        );
      }

      setNotice("Authenticator verified. Your secure session is ready.");

      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (verificationError) {
      console.error("TOTP verification failed:", verificationError);

      setError(
        verificationError.message ||
          "Verification failed. Check the code and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Sign out.
  const handleSignOut = async () => {
    setError("");

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (signOutError) {
      setError(signOutError.message || "Could not sign out.");
    }
  };

  // Handle both raw SVG and data URL QR representations.
  const qrImageSource = qrCode
    ? qrCode.startsWith("data:")
      ? qrCode
      : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`
    : "";

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-7 text-center">
          <p className="section-label">FAST SPORTS PORTAL</p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#142b4a]">
            {isEnrollment
              ? "Set up two-factor authentication"
              : "Verify your identity"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isEnrollment
              ? "Use an authenticator app to protect your account. This setup is required before you can access the portal."
              : "Open your authenticator app and enter the current six-digit code for your FAST Sports Portal account."}
          </p>
        </div>

        {mfaError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {mfaError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
          >
            {notice}
          </div>
        )}

        {isStatusError && (
          <div className="mb-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
            We could not confirm your MFA status. Please sign out and sign in
            again. If the problem continues, contact the portal administrator.
          </div>
        )}

        {isEnrollment && !factorId && (
          <div className="mb-6 rounded-xl bg-slate-50 p-5">
            <h2 className="font-semibold text-[#142b4a]">
              Set up your authenticator
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start setup to generate a new QR code. Scan it with Google
              Authenticator, Microsoft Authenticator, or another TOTP-compatible
              app.
            </p>

            <button
              type="button"
              onClick={startEnrollment}
              disabled={busy || isStatusError}
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Preparing setup..." : "Start authenticator setup"}
            </button>
          </div>
        )}

        {isEnrollment && factorId && (
          <div className="mb-6 rounded-xl bg-slate-50 p-5">
            <h2 className="font-semibold text-[#142b4a]">
              1. Scan this QR code
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open Google Authenticator or Microsoft Authenticator, add an
              account, and scan this QR code.
            </p>

            {qrImageSource && (
              <div className="my-4 flex justify-center rounded-lg bg-white p-4">
                <img
                  src={qrImageSource}
                  alt="Authenticator setup QR code"
                  className="h-52 w-52"
                />
              </div>
            )}

            {secret && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Can't scan? Enter this setup key manually
                </p>

                <p className="mt-2 break-all rounded-md border border-slate-200 bg-white p-3 font-mono text-sm text-slate-800">
                  {secret}
                </p>
              </div>
            )}

            <h2 className="mt-6 font-semibold text-[#142b4a]">
              2. Verify the authenticator
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the current six-digit code shown by your authenticator app.
            </p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <label
            htmlFor="totp-code"
            className="block text-sm font-semibold text-slate-700"
          >
            Six-digit authenticator code
          </label>

          <input
            id="totp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="form-input text-center text-xl tracking-[0.4em]"
            required
          />

          <button
            type="submit"
            disabled={
              busy ||
              code.length !== 6 ||
              isStatusError ||
              (isEnrollment && !factorId)
            }
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Verifying..."
              : isStatusError
                ? "MFA status unavailable"
                : isEnrollment
                  ? "Enable authenticator"
                  : "Verify and continue"}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">{user.email}</p>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
};

export default Mfa;
