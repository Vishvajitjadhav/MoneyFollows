"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type ResponsiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Visually hide the header (it stays available to screen readers). */
  hideHeader?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Bottom drawer on phones (thumb-friendly), centered dialog on desktop. */
export function ResponsiveSheet({ open, onOpenChange, title, description, hideHeader, className, children }: ResponsiveSheetProps) {
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg", className)}>
          <DialogHeader className={cn("px-6 pt-6", hideHeader && "sr-only")}>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className={cn("rounded-t-3xl data-[vaul-drawer-direction=bottom]:max-h-[94dvh]", className)}>
        <DrawerHeader className={cn("pb-1 text-left", hideHeader && "sr-only")}>
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : <DrawerDescription className="sr-only">{title}</DrawerDescription>}
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
