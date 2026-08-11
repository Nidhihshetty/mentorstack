"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MenteeHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main home page
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
