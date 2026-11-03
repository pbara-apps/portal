import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { LuArrowLeft, LuMail, LuMailCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorToast } from "@/components/shared/toast-notification";
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { useForgotPassword } from "@/lib/api/auth";

/**
 * Admin "forgot password". Sends a reset link by email. The page always
 * shows the same confirmation, so it never reveals which emails exist.
 */
export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({ mode: "onTouched" });

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await forgot.mutateAsync(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Please try again in a moment.", "Request failed");
    }
  };

  return (
    <AuthCardLayout
      title="Forgot password"
      subtitle="For association executives. Chapter officers should ask their counsellor or the association for a new one-time password."
    >
      {sentTo ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <LuMailCheck size={28} className="text-primary" />
          <p className="text-sm text-text-dark">
            If <strong>{sentTo}</strong> belongs to an admin account, we've sent a link to reset the password.
            It works once and expires in 30 minutes.
          </p>
          <p className="text-xs text-text-muted">Check your spam folder if it doesn't arrive in a few minutes.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
          <Button type="submit" size="lg" loading={forgot.isPending} className="w-full bg-primary text-white">
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary">
        <LuArrowLeft size={14} /> Back to sign in
      </Link>
    </AuthCardLayout>
  );
}
