"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  side = "right",
  ...props
}: Dialog.DialogContentProps & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Content
        className={cn(
          "fixed z-50 h-full w-full max-w-md bg-background p-6 shadow-xl focus:outline-none",
          side === "right" ? "right-0 top-0" : "left-0 top-0",
          className,
        )}
        {...props}
      >
        <Dialog.Close className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
        {props.children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-5 space-y-1.5 text-left", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: Dialog.DialogTitleProps) {
  return <Dialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: Dialog.DialogDescriptionProps) {
  return <Dialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
