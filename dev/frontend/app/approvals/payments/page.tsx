"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalsPaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/approvals/payment-requests");
  }, [router]);

  return null;
}
