import { redirect } from 'next/navigation';

/** Legacy project detail → Product detail */
export default async function CeoProjectDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  redirect(`/ceo/product/${resolved.id}`);
}
