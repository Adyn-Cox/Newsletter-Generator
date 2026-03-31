import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function normalizeYoutubeUrl(url: string): string {
  try {
    const u = new URL(url)
    let videoId: string | null = null
    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1)
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v')
    }
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
  } catch {
    // fall through
  }
  return url
}

async function fetchVideoTitle(youtubeUrl: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.title ?? null
  } catch {
    return null
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: newsletterId } = await params

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: { _count: { select: { links: true } } },
  })
  if (!newsletter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (newsletter.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (newsletter._count.links >= 12) {
    return NextResponse.json({ error: 'Maximum 12 links per newsletter' }, { status: 400 })
  }

  const { url } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const normalizedUrl = normalizeYoutubeUrl(url.trim())

  const existing = await prisma.newsletterLink.findUnique({
    where: { newsletterId_youtubeUrl: { newsletterId, youtubeUrl: normalizedUrl } },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'This link has already been added to this newsletter' },
      { status: 409 }
    )
  }

  const videoTitle = await fetchVideoTitle(normalizedUrl)

  const link = await prisma.newsletterLink.create({
    data: { newsletterId, youtubeUrl: normalizedUrl, videoTitle, status: 'PENDING' },
  })

  return NextResponse.json(link, { status: 201 })
}
