import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit text-white">
          <Logo size="md" tone="mono" />
        </Link>
        <div className="max-w-md space-y-4">
          <p className="text-5xl leading-[1.05] font-bold tracking-[-0.035em]">Follow your money.</p>
          <p className="text-lg text-white/85">
            Record an expense in five seconds. See where every rupee goes — food, rent, family, SIPs — without
            maintaining a spreadsheet.
          </p>
        </div>
        <p className="text-sm text-white/70">Free · Private · Works on your phone</p>
        <svg
          aria-hidden
          viewBox="0 0 400 400"
          className="pointer-events-none absolute -right-24 -bottom-24 size-[420px] text-white/10"
        >
          <path
            d="M40 330V110l100 120 100-120h60"
            fill="none"
            stroke="currentColor"
            strokeWidth="44"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="360" cy="110" r="30" fill="currentColor" />
        </svg>
      </aside>

      <main className="flex flex-1 flex-col px-4 pt-safe pb-safe sm:px-6">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-10">
          <Link href="/" className="w-fit lg:hidden">
            <Logo size="md" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
