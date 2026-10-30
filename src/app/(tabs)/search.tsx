import { AiSearchView } from '@/app/image-search';

/** The Search tab is the AI search experience (text · image · ask), geo-aware. */
export default function SearchTab() {
  return <AiSearchView edges={['top']} title="Search" />;
}
