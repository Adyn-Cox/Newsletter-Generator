import { auth } from '@clerk/nextjs/server'
import { SignInButton } from '@clerk/nextjs'
import { getNewsletterListForUser } from '@/lib/newsletter-list'
import NewsletterApp from './components/NewsletterApp'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4">
              <span className="text-4xl">🏈</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight">
              Turn YouTube tape into <br className="hidden sm:block" />
              <span className="text-emerald-600">elite fantasy newsletters.</span>
            </h1>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Drop in YouTube links from your favorite fantasy analysts. We watch the tape, extract the actionable advice, and draft a ready-to-send newsletter in seconds.
            </p>
          </div>

          <div className="pt-4 pb-8 border-b border-zinc-200">
            <SignInButton mode="modal">
              <button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                Start Writing for Free
              </button>
            </SignInButton>
            <p className="text-sm text-zinc-400 mt-4">No credit card required.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-left pt-4">
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">1. Paste Links</h3>
              <p className="text-sm text-zinc-500">Drop up to 12 YouTube URLs from waiver wire shows, start/sit videos, or rankings.</p>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">2. AI Watches Tape</h3>
              <p className="text-sm text-zinc-500">Our models read the transcripts, filter out the fluff, and pull the actual fantasy advice.</p>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">3. Ready to Send</h3>
              <p className="text-sm text-zinc-500">Get a beautifully formatted, engaging newsletter draft ready to copy and paste.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const initialNewsletters = await getNewsletterListForUser(userId)
  return <NewsletterApp initialNewsletters={initialNewsletters} />
}
