"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast.success("₹250 Food expense added.", { action: { label: "Undo", onClick: () => {} } })}
      >
        Success toast
      </Button>
      <Button variant="outline" onClick={() => toast.warning("You've used 82% of your Food budget.")}>
        Warning toast
      </Button>
      <Button variant="outline" onClick={() => toast.error("Couldn't save. Check your connection.")}>
        Error toast
      </Button>
    </div>
  );
}
