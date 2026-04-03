import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sprout, Leaf, BarChart3, Users } from 'lucide-react'

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">HarvestHub</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-4xl space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Manage Your Farm with <span className="text-green-600">Confidence</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              A comprehensive farm management system to track crops, livestock, sales, expenses, and
              more. All in one place.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-green-700 hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border-2 border-green-600 px-8 py-4 text-lg font-semibold text-green-600 transition-colors hover:bg-green-50"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <Leaf className="mb-3 h-10 w-10 text-green-600" />
              <h3 className="mb-2 font-semibold text-gray-900">Crop Management</h3>
              <p className="text-sm text-gray-600">
                Track planting, growth, and harvest schedules for all your crops
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <Users className="mb-3 h-10 w-10 text-green-600" />
              <h3 className="mb-2 font-semibold text-gray-900">Flock Tracking</h3>
              <p className="text-sm text-gray-600">
                Monitor livestock health, breeding, and production records
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <BarChart3 className="mb-3 h-10 w-10 text-green-600" />
              <h3 className="mb-2 font-semibold text-gray-900">Financial Reports</h3>
              <p className="text-sm text-gray-600">
                Track sales, expenses, and profitability with detailed analytics
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <Sprout className="mb-3 h-10 w-10 text-green-600" />
              <h3 className="mb-2 font-semibold text-gray-900">Inventory Control</h3>
              <p className="text-sm text-gray-600">
                Manage supplies, equipment, and resources efficiently
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 py-6 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} HarvestHub. Your complete farm management solution.
        </div>
      </footer>
    </div>
  )
}
