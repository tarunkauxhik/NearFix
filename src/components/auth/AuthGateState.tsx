import { Link } from 'react-router-dom';

import Spinner from '@/components/Spinner';

export function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}

export function ViewerResolutionError({
  title = 'We could not load your NearFix account',
  description = 'Your sign-in succeeded, but the app could not finish loading your role and permissions. Please retry in a moment.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center text-white">
        <h1 className="text-xl font-black">{title}</h1>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/auth/post-auth"
            className="rounded-xl bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry account check
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
