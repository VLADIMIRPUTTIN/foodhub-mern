import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

// Add these exports for DialogTitle and VisuallyHidden
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

// Add VisuallyHidden component
export const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    {...props}
    style={{
      position: "absolute",
      border: 0,
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      wordWrap: "normal",
    }}
  />
));

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "left" | "right" | "top" | "bottom" }
>(({ side = "right", className, children, ...props }, ref) => (
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
        ${className || ""}`}
      {...props}
    >
      {/* Add hidden title for accessibility */}
      <VisuallyHidden>Sheet Content</VisuallyHidden>
      {/* Add hidden description for accessibility */}
      <DialogPrimitive.Description style={{ display: "none" }}>
        Sheet dialog content
      </DialogPrimitive.Description>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

SheetContent.displayName = "SheetContent";
VisuallyHidden.displayName = "VisuallyHidden";