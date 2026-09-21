import { HomeView } from '@/components/site/HomeView';

/** The homepage. Everything it shows lives in HomeView so a table's QR page can share it. */
export default async function HomePage() {
  return <HomeView />;
}
