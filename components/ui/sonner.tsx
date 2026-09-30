"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert } from "lucide-react";

/** App-wide toasts. Success toasts confirm saves: "₹250 Food expense added." */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      offset={16}
      mobileOffset={{ top: 12 }}
      icons={{
        success: <CircleCheck className="size-4 text-success" />,
        info: <Info className="size-4 text-invest" />,
        warning: <TriangleAlert className="size-4 text-warning" />,
        error: <CircleX className="size-4 text-destructive" />,
        loading: <LoaderCircle className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-border !bg-card !text-foreground !shadow-card !font-sans !gap-2.5",
          title: "!text-sm !font-semibold",
          description: "!text-muted-foreground",
          actionButton: "!bg-brand !text-white !rounded-lg !font-medium",
          cancelButton: "!bg-muted !text-foreground !rounded-lg",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
