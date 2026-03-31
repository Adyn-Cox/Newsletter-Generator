import { auth } from '@clerk/nextjs/server'
import { getNewsletterListForUser } from '@/lib/newsletter-list'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await getNewsletterListForUser(userId)
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name =
    body.name ||
    `Fantasy Notes – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`

  const newsletter = await prisma.newsletter.create({
    data: { userId, name },
  })

  return NextResponse.json(newsletter, { status: 201 })
}
