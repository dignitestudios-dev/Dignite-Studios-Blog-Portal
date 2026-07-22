import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardPreviewRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/preview/${id}`);
}
