import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: newsletterId, linkId } = await params

  const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } })
  if (!newsletter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (newsletter.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const link = await prisma.newsletterLink.findUnique({ where: { id: linkId } })
  if (!link || link.newsletterId !== newsletterId) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  await prisma.newsletterLink.delete({ where: { id: linkId } })
  return new NextResponse(null, { status: 204 })
}
