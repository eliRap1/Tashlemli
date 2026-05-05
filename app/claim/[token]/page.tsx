import { notFound } from "next/navigation";
import { loadPublicView } from "@/services/tracker/publicView";
import { TrackerClient } from "./TrackerClient";

interface Props { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  return {
    title: "תיק חי · תשלם לי",
    openGraph: {
      images: [{ url: `/api/og/claim/${token}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/api/og/claim/${token}`] },
  };
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;
  let view;
  try { view = await loadPublicView(token); }
  catch { return notFound(); }
  return <TrackerClient view={view} token={token} />;
}
