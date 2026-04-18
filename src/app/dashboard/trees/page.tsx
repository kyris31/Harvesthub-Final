import { getTrees } from '@/app/actions/trees'
import { TreesClient } from './trees-client'

export default async function TreesPage() {
  const treeList = await getTrees()
  return <TreesClient trees={treeList} />
}
