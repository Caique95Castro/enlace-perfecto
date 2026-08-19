import { useEffect } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublicWedding } from "@/lib/public-site.functions";
import { trackSiteEvent } from "@/services/messages";
import { formatDateLong } from "@/lib/format";
import { WeddingSiteView } from "@/components/site/WeddingSiteView";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicWedding({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Site não encontrado" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.couple.display_name} | Nosso casamento`;
    const description = `Confirme sua presença no casamento de ${loaderData.couple.display_name} — ${formatDateLong(loaderData.wedding?.wedding_date)}.`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    const image = loaderData.settings.hero_image_url;
    if (image?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
      );
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Site não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confira o endereço com os noivos — este site pode não estar publicado.
        </p>
      </div>
    </div>
  ),
  component: PublicSite,
});

function PublicSite() {
  const data = Route.useLoaderData();

  useEffect(() => {
    void trackSiteEvent(data.couple.slug, "page_view");
  }, [data.couple.slug]);

  return <WeddingSiteView data={data} interactive />;
}
