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

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void; // parent handles redirect
}

export function PaymentSuccessModal({ open, onClose }: PaymentSuccessModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center gap-2 text-lg">
            🎉 Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-sm">
          Your subscription is now active. We’ve upgraded your account — enjoy
          your new trading superpowers.
        </p>

        <div className="flex justify-center mb-4">
          <Sparkles className="text-yellow-500 w-10 h-10" />
        </div>

        <DialogFooter className="flex justify-center">
          <Link href="/dashboard">
            <Button className="bg-black text-white hover:bg-neutral-800 text-sm px-6">
              Go to Dashboard
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
