"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/settings";
import { safeAction } from "@/lib/safe-action";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [name, setName] = useState(fullName);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await safeAction(() => updateProfile({ fullName: name }));
          if (r.ok) toast.success("Name updated.");
          else toast.error(r.error);
        });
      }}
    >
      <Label htmlFor="s-name">Name</Label>
      <div className="flex gap-2">
        <Input id="s-name" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="outline" disabled={pending || name.trim() === fullName || !name.trim()}>
          {pending && <LoaderCircle className="animate-spin" />} Save
        </Button>
      </div>
    </form>
  );
}
