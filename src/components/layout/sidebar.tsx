"use client";

import {
  FileText,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Active Escrows", href: "/escrows", icon: FileText },
  { name: "Transaction History", href: "/transactions", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-secondary">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-white">
              TrustBlock
            </span>
          </div>
        </div>

        {/* New Escrow Button */}
        <div className="p-4">
          <Link href="/escrows/new">
            <Button className="w-full bg-primary/80 hover:bg-primary text-white">
              <Plus className="mr-2 size-4" />
              New Escrow
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-white"
                    : "text-secondary-foreground hover:bg-secondary hover:text-white",
                )}
              >
                <item.icon className="size-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-secondary-foreground">
            Secure your work. Trust the code.
          </p>
          <p className="mt-1 text-xs text-secondary-foreground/60">
            3% protocol fee
          </p>
        </div>
      </div>
    </aside>
  );
}
