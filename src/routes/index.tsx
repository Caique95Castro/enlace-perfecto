import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarHeart,
  Gift,
  Globe,
  Images,
  LayoutTemplate,
  QrCode,
  Users,
  Check,
} from "lucide-react";
import heroImage from "@/assets/hero-casamento.jpg";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Casamento | Crie o site do seu casamento em minutos" },
      {
        name: "description",
        content:
          "Plataforma completa para casais: site do casamento, confirmação de presença, lista de presentes e cotas de lua de mel em um único painel.",
      },
      { property: "og:title", content: "Meu Casamento | Crie o site do seu casamento" },
      {
        property: "og:description",
        content:
          "Site do casamento, RSVP, convidados e lista de presentes. Tudo em português e pronto para compartilhar.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: LayoutTemplate,
    title: "Três templates exclusivos",
    text: "Elegante, Romântico ou Minimalista — troque quando quiser, sem perder nada.",
  },
  {
    icon: Users,
    title: "Convidados organizados",
    text: "Cadastre, agrupe e acompanhe confirmados, pendentes e recusados em tempo real.",
  },
  {
    icon: CalendarHeart,
    title: "RSVP automático",
    text: "Seus convidados confirmam presença pelo site e o painel atualiza sozinho.",
  },
  {
    icon: Gift,
    title: "Presentes e cotas",
    text: "Crie presentes físicos ou cotas de lua de mel com barra de progresso.",
  },
  {
    icon: Images,
    title: "Galeria de fotos",
    text: "Suba as fotos do casal e monte a história de vocês em poucos cliques.",
  },
  {
    icon: QrCode,
    title: "Link e QR Code",
    text: "Compartilhe meucasamento.app/joao-e-maria no convite, no WhatsApp ou impresso.",
  },
];

function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            {loading ? null : user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ modo: "cadastro" }}>
                    Criar meu site
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Feito para casais brasileiros
            </span>
            <h1 className="mt-5 text-balance-title font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              O site do seu casamento, do convite ao último presente
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Crie uma página linda para o grande dia, receba confirmações de presença e organize a
              lista de presentes — tudo em um painel simples, em português.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth" search={{ modo: "cadastro" }}>
                  Começar gratuitamente
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/auth">Já tenho conta</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {["Sem cartão de crédito", "Link público personalizado", "RSVP ilimitado", "Cotas de lua de mel"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="fade-up relative">
            <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
              <img
                src={heroImage}
                alt="Alianças de casamento sobre mesa posta com convite e folhagem"
                className="h-full w-full object-cover"
                width={1600}
                height={1200}
              />
            </div>
            <div className="surface-card absolute -bottom-6 left-4 hidden w-56 p-4 sm:block">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Confirmados</p>
              <p className="font-display text-3xl font-semibold">128</p>
              <p className="text-xs text-muted-foreground">de 160 convidados</p>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-card/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">
              Tudo o que vocês precisam
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Da personalização do site à conferência dos presentes recebidos.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="surface-card p-6 transition-shadow hover:shadow-md">
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Globe className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              Pronto para contar essa história?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Leva menos de cinco minutos para publicar a primeira versão do site.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-full">
              <Link to="/auth" search={{ modo: "cadastro" }}>
                Criar meu casamento
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo muted />
          <p>© {new Date().getFullYear()} Meu Casamento. Feito com carinho no Brasil.</p>
        </div>
      </footer>
    </div>
  );
}
