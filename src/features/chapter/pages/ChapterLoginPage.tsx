import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { LuArrowRight, LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useChapterLogin } from "../api/auth";
import { useChapterSession } from "../store/useChapterSession";

type LoginValues = { email: string; password: string };

/**
 * Chapter portal sign-in for counsellors, presidents and secretaries.
 * First-time users (one-time password) are sent to change their password.
 */
export default function ChapterLoginPage() {
  const navigate = useNavigate();
  const token = useChapterSession((s) => s.token);
  const signIn = useChapterSession((s) => s.signIn);
  const login = useChapterLogin();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  if (token) return <Navigate to="/chapter" replace />;

  const onSubmit = async (values: LoginValues) => {
    try {
      const { token: newToken, user } = await login.mutateAsync(values);
      signIn(newToken, user);
      if (!user.hasChangedPassword) {
        navigate("/chapter/change-password", { replace: true });
        successToast("Please choose your own password to continue.", "Welcome");
      } else {
        navigate("/chapter", { replace: true });
      }
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Sign in failed.", "Sign in failed");
    }
  };

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden">
      <AuthBrandPanel />
      <section className="flex w-full flex-1 flex-col items-center justify-center bg-background px-4 py-8 lg:w-1/2 lg:bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <img src="/images/ra-logo.png" alt="RA logo" className="mb-2 h-12 w-12 rounded-full object-cover" />
            <p className="text-lg font-bold text-primary">Royal Ambassadors</p>
          </div>
          <div className="rounded-2xl border border-text-dark/5 bg-surface p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Chapter Portal</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              For church counsellors and chapter presidents and secretary.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5" noValidate>
              <Input
                {...register("email", {
                  required: "Email address is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
                })}
                type="email"
                label="Email Address"
                autoComplete="email"
                error={errors.email?.message}
                startContent={<LuMail size={16} />}
              />
              <Input
                {...register("password", { required: "Password is required" })}
                type={showPassword ? "text" : "password"}
                label="Password"
                autoComplete="current-password"
                error={errors.password?.message}
                startContent={<LuLock size={16} />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-text-muted hover:text-text-dark"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                  </button>
                }
              />
              <p className="text-xs text-text-muted">
                First time here? Use the one-time password sent to your email.
              </p>
              <Button type="submit" size="lg" loading={login.isPending} className="w-full bg-primary text-white">
                Sign In
                {!login.isPending && <LuArrowRight size={18} />}
              </Button>
            </form>
            <p className="mt-6 text-xs text-text-muted">
              Forgot your password? Ask your church counsellor (presidents and secretaries) or the association
              (counsellors) to send you a new one-time password.
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-text-muted">
            Association executive?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-gold">
              Sign in to the Admin Portal
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
