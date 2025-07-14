import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "left" | "right" | "top" | "bottom" }
>(({ side = "right", className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all"
    />
    <DialogPrimitive.Content
      ref={ref}
      className={`fixed z-50 bg-white shadow-xl transition-all duration-300 ease-in-out
        ${side === "left" ? "left-0 top-0 h-full w-80" : ""}
        ${side === "right" ? "right-0 top-0 h-full w-80" : ""}
        ${side === "top" ? "top-0 left-0 w-full h-80" : ""}
        ${side === "bottom" ? "bottom-0 left-0 w-full h-80" : ""}
        ${className || ""}
      `}
      {...props}
    />
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";