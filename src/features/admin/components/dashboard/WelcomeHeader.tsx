import useCurrentUser from "@/hooks/useCurrentUser";

const WelcomeHeader = () => {
  const { user } = useCurrentUser();
  const displayName = user?.name?.trim() || "User";

  return (
    <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Here&apos;s what&apos;s happening across PBA Royal Ambassadors today.
        </p>
      </div>
      <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-text-muted sm:text-right">
        {new Date().toLocaleDateString("en-NG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </header>
  );
};

export default WelcomeHeader;
