"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "0.75rem" }}>
        Something went wrong
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
        Please retry this action.
      </p>
      <button className="btn-primary" onClick={() => unstable_retry()}>
        Try again
      </button>
    </div>
  );
}
