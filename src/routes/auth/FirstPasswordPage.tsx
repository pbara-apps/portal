import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { LuLogOut } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import {
  landingPath,
  signOutEverywhere,
  useAccount,
  useAccountChangePassword,
} from "@/lib/auth/session";

type Values = { currentPassword: string; newPassword: string; confirmPassword: string };

/**
 * First sign-in: the person signed in with a one-time password (or an
 * existing password after the portal restructure) and must choose a new
 * one before they can use either portal.
 */
export default function FirstPasswordPage() {
  const navigate = useNavigate();
  const account = useAccount();
  const changePassword = useAccountChangePassword();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Values>({ mode: "onTouched" });

  if (!account.token) return <Navigate to="/login" replace />;
  if (account.hasChangedPassword) return <Navigate to={landingPath(account)} replace />;

  const onSubmit = async ({ currentPassword, newPassword }: Values) => {
    try {
      const session = await changePassword.mutateAsync({ currentPassword, newPassword });
      successToast("Your password has been set.", "All done");
      navigate(
        landingPath({
          hasChangedPassword: true,
          hasAdmin: Boolean(session.admin),
          hasChapter: Boolean(session.chapter),
        }),
        { replace: true },
      );
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to change password.", "Error");
    }
  };

  return (
    <AuthCardLayout
      title={`Welcome, ${account.name.split(" ")[0] || "there"}`}
      subtitle="Choose your own password to start using the portal. Use at least 8 characters, with at least one letter and one number."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Input
          {...register("currentPassword", { required: "Enter the password you signed in with" })}
          type="password"
          label="Current password"
          placeholder="The password you just used"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
        />
        <Input
          {...register("newPassword", {
            required: "Enter a new password",
            minLength: { value: 8, message: "Use at least 8 characters" },
            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number",
          })}
          type="password"
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
        />
        <Input
          {...register("confirmPassword", {
            required: "Confirm your new password",
            validate: (v) => v === watch("newPassword") || "Passwords don't match",
          })}
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" size="lg" loading={changePassword.isPending} className="w-full bg-primary text-white">
          Save password and continue
        </Button>
        <button
          type="button"
          onClick={() => {
            signOutEverywhere();
            navigate("/login", { replace: true });
          }}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-primary"
        >
          <LuLogOut size={13} /> Sign out
        </button>
      </form>
    </AuthCardLayout>
  );
}
