import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { LuArrowLeft, LuLock } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { useResetPassword } from "@/lib/api/auth";

type Values = { password: string; confirm: string };

/** Opened from the reset email: choose a new password. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const reset = useResetPassword();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Values>({ mode: "onTouched" });

  const onSubmit = async ({ password }: Values) => {
    try {
      await reset.mutateAsync({ token, password });
      successToast("Password changed. Please sign in.", "Done");
      navigate("/login", { replace: true });
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reset password.", "Reset failed");
    }
  };

  if (!/^[a-f\d]{64}$/i.test(token)) {
    return (
      <AuthCardLayout title="Link not valid" subtitle="This reset link is incomplete or broken.">
        <Button asChild className="w-full bg-primary text-white"><Link to="/forgot-password">Request a new link</Link></Button>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout title="Choose a new password" subtitle="Use at least 8 characters, with at least one letter and one number.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Input
          {...register("password", {
            required: "Enter a new password",
            minLength: { value: 8, message: "Use at least 8 characters" },
            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number",
          })}
          type="password"
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          startContent={<LuLock size={16} />}
        />
        <Input
          {...register("confirm", {
            required: "Confirm your new password",
            validate: (v) => v === watch("password") || "Passwords don't match",
          })}
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          startContent={<LuLock size={16} />}
        />
        <Button type="submit" size="lg" loading={reset.isPending} className="w-full bg-primary text-white">
          Save new password
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary">
        <LuArrowLeft size={14} /> Back to sign in
      </Link>
    </AuthCardLayout>
  );
}
