import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarHeart,
  CreditCard,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  Palette,
  Settings,
  ShieldCheck,
  Users,
  MailCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/casamento", label: "Meu casamento", icon: CalendarHeart },
  { to: "/dashboard/site", label: "Meu site", icon: Palette },
  { to: "/dashboard/convidados", label: "Convidados", icon: Users },
  { to: "/dashboard/rsvp", label: "RSVP", icon: MailCheck },
  { to: "/dashboard/mensagens", label: "Mural de mensagens", icon: MessageSquareHeart },
  { to: "/dashboard/presentes", label: "Lista de presentes", icon: Gift },
  { to: "/dashboard/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
] as const;


function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-5">
          <Logo muted />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Menu do painel</SheetTitle>
              <div className="flex h-16 items-center px-5">
                <Logo muted />
              </div>
              <div className="px-3">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-4 border-t border-sidebar-border p-3">
                <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Logo muted />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
