import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'

const Sidebar = () => {
  return (
    <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7]">
        <div className="flex flex-1 flex-col overflow-y-auto pt-10 pb-4">
          <div className="flex flex-shrink-0 items-center px-10">
            <Logo className="h-16 w-16" />
          </div>
          <nav className="mt-12 flex-1 space-y-8 px-10">
            <Link
              className="flex text-lg text-white text-opacity-80 hover:text-opacity-100"
              href="/"
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
