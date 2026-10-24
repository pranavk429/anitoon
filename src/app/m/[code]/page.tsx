import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SharedMascot from "@/components/site/SharedMascot";
import { decodeSpec } from "@/lib/mascot/spec";

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;
  const spec = decodeSpec(code);
  if (!spec) return { title: "Mascot not found" };
  return {
    title: `${spec.name} — ${spec.tagline}`,
    description: `A ${spec.vibe} ${spec.species} mascot made with Toonify. ${spec.tagline}. Play the 11 authored moves or remix it.`,
    alternates: { canonical: `/m/${code}` },
    openGraph: {
      title: `${spec.name} — ${spec.tagline}`,
      description: `A ${spec.vibe} ${spec.species} mascot made with Toonify.`,
      url: `/m/${code}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${spec.name} — ${spec.tagline}`,
      description: `A ${spec.vibe} ${spec.species} mascot made with Toonify.`,
    },
  };
}

export default async function MascotPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const spec = decodeSpec(code);
  if (!spec) notFound();
  return (
    <SharedMascot
      spec={spec}
      code={code}
      embed={query.embed === "1" || query.embed === "true"}
    />
  );
}
