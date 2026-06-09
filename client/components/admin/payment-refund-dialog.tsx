"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PaymentRefundDialog({
  open,
  onOpenChange,
  paymentId,
  isRefunding,
  onConfirmRefund,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  isRefunding: boolean;
  onConfirmRefund: (opts: { reason?: string }) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process refund</AlertDialogTitle>
          <AlertDialogDescription>
            {paymentId ? (
              <>
                Refund payment <span className="font-mono">{paymentId}</span>
              </>
            ) : (
              "Refund payment?"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Optional refund reason (visible to ops):
          </div>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            disabled={isRefunding}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmRefund({ reason: reason || undefined })}
            disabled={isRefunding || !paymentId}
          >
            {isRefunding ? "Refunding…" : "Refund"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

