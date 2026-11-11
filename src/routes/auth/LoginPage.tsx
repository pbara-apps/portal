import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  LuArrowRight,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { ForgotPasswordDialog } from "@/features/auth/components/ForgotPasswordDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { landingPath, useAccountLogin } from "@/lib/auth/session";
import { normalizeReturnPath } from "@/lib/auth/redirect";
import { useSession } from "@/store/useSession";

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = from ? normalizeReturnPath(from) : null;
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  const { mutateAsync: login, isPending: isLoginPending } = useAccountLogin();

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const session = await login({ email: data.email.trim(), password: data.password });
      useSession.getState().clearSessionExpired();
      const next = landingPath(
        {
          hasChangedPassword: session.account.hasChangedPassword,
          hasAdmin: Boolean(session.admin),
          hasChapter: Boolean(session.chapter),
        },
        returnTo,
      );
      navigate(next, { replace: true });
      if (next === "/change-password") {
        successToast("Please choose your own password to continue.", "Welcome");
      } else {
        successToast("Signed in successfully", "Welcome back");
      }
    } catch (err) {
      const e = err as { message?: string };
      errorToast(e?.message || "Sign in failed. Please try again.", "Sign in failed");
    }
  };

  const emailReg = register("email", {
    required: "Email address is required",
    pattern: {
      value: EMAIL_PATTERN,
      message: "Please enter a valid email address",
    },
  });

  const passwordReg = register("password", {
    required: "Password is required",
  });

  return (
    <div className="flex min-h-dvh w-full max-w-[100vw] overflow-x-hidden lg:min-h-screen">
      <AuthBrandPanel />

      <section className="relative flex w-full min-w-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto overscroll-contain bg-background px-4 py-5 sm:px-6 sm:py-6 lg:w-1/2 justify-center lg:overflow-hidden lg:bg-surface lg:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden"
        >
          <div className="aurora-blob-1 absolute -right-32 -top-32 h-[280px] w-[280px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl sm:h-[360px] sm:w-[360px]" />
          <div className="aurora-blob-2 absolute -bottom-32 -left-24 h-[240px] w-[240px] rounded-full bg-gradient-to-br from-gold/15 to-transparent blur-3xl sm:h-[300px] sm:w-[300px]" />
        </div>

        <div className="relative z-10 mx-auto w-full min-w-0 max-w-xl py-1 sm:py-2 lg:py-0">
          <div className="mb-3 flex flex-col items-center text-center sm:mb-6 lg:hidden">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl">
              <img
                src="/images/ra-logo.png"
                alt="RA logo"
                className="h-12 w-12 rounded-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
              Royal Ambassadors
            </h1>
            <p className="text-sm font-bold tracking-tight text-primary sm:text-base">
              Pentecost Baptist Association
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-text-dark/5 bg-surface p-4 sm:p-6 lg:p-8">
            <header className="mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                Welcome Back
              </h2>
              <p className="mt-1.5 text-sm text-text-muted sm:text-base">
                One sign-in for executives, church counsellors and chapter officers.
              </p>
            </header>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-5 flex min-w-0 flex-col gap-y-4 sm:mt-8 sm:gap-y-6"
              noValidate
            >
              <Input
                {...emailReg}
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
              />

              <Input
                {...passwordReg}
                type={showPassword ? "text" : "password"}
                label={
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="shrink-0">Password</span>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="shrink-0 text-[11px] font-semibold text-primary transition-colors hover:text-gold"
                    >
                      Forgot password?
                    </button>
                  </div>
                }
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-text-muted transition-colors hover:text-text-dark focus:outline-none focus-visible:text-text-dark"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <LuEyeOff size={16} />
                    ) : (
                      <LuEye size={16} />
                    )}
                  </button>
                }
              />

              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-text-muted"
                    >
                      Remember this device
                    </label>
                  </div>
                )}
              />

              <Button
                type="submit"
                size="lg"
                loading={isLoginPending}
                className="group w-full bg-primary py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-[#040e3d] active:scale-[0.99]"
              >
                Sign In
                {!isLoginPending ? <LuArrowRight size={18} /> : null}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-sm text-text-muted">
            First time here? Use the one-time password sent to your email.
          </p>

          
        </div>
      </section>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
