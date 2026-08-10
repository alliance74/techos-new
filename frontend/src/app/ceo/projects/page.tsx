import { redirect } from 'next/navigation';

/** Legacy Projects route → Product hub */
export default function CeoProjectsRedirectPage() {
  redirect('/ceo/product');
}
