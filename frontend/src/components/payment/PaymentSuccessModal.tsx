"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PaymentSuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center gap-2">
            🎉 Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
          Your subscription is now active.
        </p>

        <Sparkles className="mx-auto text-yellow-500 w-10 h-10 mb-4" />

        <DialogFooter className="flex justify-center">
          <Link href="/dashboard">
            <Button className="bg-black text-white hover:bg-neutral-800">Go to Dashboard</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
