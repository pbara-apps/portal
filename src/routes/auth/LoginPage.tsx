import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  LuArrowRight,
  LuCircleHelp,
  LuEye,
  LuEyeOff,
  LuLock,
  LuMail,
} from "react-icons/lu";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { useLogin } from "@/lib/api/auth";
import { normalizeReturnPath } from "@/lib/auth/redirect";
import useCurrentUser from "@/hooks/useCurrentUser";
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
  const returnTo = normalizeReturnPath(searchParams.get("from"));
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  const { mutateAsync: login, isPending: isLoginPending } = useLogin();
  const { setCurrentUser } = useCurrentUser();

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
      };
      const response = await login(payload);
      const user = response.user as {
        _id?: string;
        id?: string;
        name: string;
        email?: string;
        phone?: string;
        office_id?: string;
        church_id?: string;
        rank_id?: string | null;
        start_year?: number;
        end_year?: number | null;
        status?: "active" | "inactive" | "completed";
        office?: { _id?: string; name?: string };
        church?: { _id?: string; name?: string; chapter?: string };
        rank?: { _id?: string; name?: string };
        role?: "super_admin" | "admin" | "editor" | "viewer";
      };
      setCurrentUser({
        user: {
          id: user._id ?? user.id ?? "",
          name: user.name,
          email: user.email ?? data.email,
          phone: user.phone ?? "",
          officeId: user.office_id ?? user.office?._id ?? "",
          officeName: user.office?.name ?? "",
          churchId: user.church_id ?? user.church?._id ?? "",
          churchName: user.church?.name ?? "",
          chapterName: user.church?.chapter ?? "",
          rankId: user.rank_id ?? user.rank?._id ?? null,
          rankName: user.rank?.name ?? "",
          status: user.status ?? "active",
          startYear: user.start_year,
          endYear: user.end_year ?? null,
          role: user.role ?? "viewer",
          token: response.token,
        },
        token: response.token,
      });
      useSession.getState().clearSessionExpired();
      navigate(returnTo, { replace: true });
      successToast("Login successful", "Sign in successful");
    } catch (err) {
      console.log(err);
      const e = err as { message?: string };
      const errMessage = e?.message || "Sign in failed. Please try again.";
      errorToast(errMessage, "Sign in failed");
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
    minLength: { value: 6, message: "Must be at least 6 characters" },
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
                Access the Institutional Administration Portal.
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
                placeholder="admin@pba.org"
                autoComplete="email"
                error={errors.email?.message}
                startContent={<LuMail size={16} className="text-text-muted" />}
              />

              <Input
                {...passwordReg}
                type={showPassword ? "text" : "password"}
                label={
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="shrink-0">Password</span>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="shrink-0 text-[11px] font-semibold text-primary transition-colors hover:text-gold"
                    >
                      Forgot password?
                    </button>
                  </div>
                }
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                startContent={<LuLock size={16} className="text-text-muted" />}
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

          <div className="mt-4 flex justify-center pb-2 sm:mt-5">
            <button
              type="button"
              className="inline-flex max-w-full items-center gap-1.5 px-1 text-center text-xs text-text-muted transition-colors hover:text-primary"
            >
              <LuCircleHelp size={14} className="shrink-0" />
              <span>Need assistance with your account?</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
