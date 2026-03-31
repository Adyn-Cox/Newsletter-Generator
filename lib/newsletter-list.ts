import { prisma } from '@/lib/prisma'

export type NewsletterListItem = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  linkCount: number
  summaryCount: number
}

export async function getNewsletterListForUser(userId: string): Promise<NewsletterListItem[]> {
  const newsletters = await prisma.newsletter.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { links: true } },
      links: { select: { status: true } },
    },
  })

  return newsletters.map((n) => ({
    id: n.id,
    name: n.name,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    linkCount: n._count.links,
    summaryCount: n.links.filter((l) => l.status === 'PROCESSED').length,
  }))
}
