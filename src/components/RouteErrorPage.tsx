import { AlertTriangle } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return "The page you are looking for could not be found.";
  }

  return "There was a problem loading this page. This might be due to a network issue or the page may have been updated.";
}

export function RouteErrorPage() {
  const error = useRouteError();
  const description = getErrorMessage(error);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <AlertTriangle
          className="mb-6 size-14 text-[#e85d6c]"
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          Failed to load page
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
          {description}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 rounded-full bg-zinc-800 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Reload App
        </button>
      </div>
    </div>
  );
}
