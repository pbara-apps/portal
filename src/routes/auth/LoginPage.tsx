import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import useCurrentUser from "@/hooks/useCurrentUser";

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
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
        start_year?: number;
        end_year?: number | null;
        status?: "active" | "inactive" | "completed";
        office?: { _id?: string; name?: string };
        church?: { _id?: string; name?: string; chapter?: string };
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
          status: user.status ?? "active",
          startYear: user.start_year,
          endYear: user.end_year ?? null,
          role: user.role ?? "viewer",
          token: response.token,
        },
        token: response.token,
      });
      navigate("/admin");
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
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <section className="relative flex w-full items-center justify-center overflow-hidden bg-background p-4 lg:w-1/2 lg:bg-surface lg:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 lg:hidden"
        >
          <div className="aurora-blob-1 absolute -right-32 -top-32 h-[360px] w-[360px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
          <div className="aurora-blob-2 absolute -bottom-32 -left-24 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-gold/15 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
              <img
                src="/images/ra-logo.png"
                alt="RA logo"
                width={100}
                height={100}
                className="rounded-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Royal Ambassadors
            </h1>
            <h3 className="text-xl font-bold tracking-tight text-primary">
              Pentecost Baptist Association
            </h3>
          </div>

          <div className="rounded-2xl borde border-text-dark/[0.05] bg-surface p-6 sm:p-8">
            <header className="mb-6 sm:mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-5xl">
                Welcome Back
              </h2>
              <p className="mt-1.5 text-base text-text-muted">
                Access the Institutional Administration Portal.
              </p>
            </header>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-y-8 mt-16"
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
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-[11px] font-semibold text-primary transition-colors hover:text-gold"
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
                    className="text-text-muted transition-colors hover:text-text-dark focus:outline-none focus-visible:text-text-dark"
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
                    <label htmlFor="remember" className="text-sm text-text-muted">
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

            <footer className="mt-8 border-t border-text-dark/[0.05] pt-5 text-center">
              <p className="text-sm text-text-muted">
                Authorized personnel only.
              </p>
            </footer>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-primary"
            >
              <LuCircleHelp size={14} />
              Need assistance with your account?
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
