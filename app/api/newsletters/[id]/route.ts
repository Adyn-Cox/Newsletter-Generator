import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function getOwned(id: string, userId: string) {
  const newsletter = await prisma.newsletter.findUnique({ where: { id } })
  if (!newsletter) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (newsletter.userId !== userId) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { newsletter }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await getOwned(id, userId)
  if (error) return error

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
    include: {
      links: {
        orderBy: { addedAt: 'asc' },
        include: { summary: true },
      },
    },
  })

  return NextResponse.json(newsletter)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await getOwned(id, userId)
  if (error) return error

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const updated = await prisma.newsletter.update({
    where: { id },
    data: { name: name.trim() },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await getOwned(id, userId)
  if (error) return error

  await prisma.newsletter.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
