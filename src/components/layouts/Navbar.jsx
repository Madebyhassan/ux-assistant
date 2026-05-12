function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Logo + badge — always visible */}
      <div className="flex items-center gap-8">
        <a href="/" className="text-lg font-bold text-indigo-500">
          Hassan
        </a>
        <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
          ✦ AI Tool
        </span>
      </div>

      {/* Nav links — hidden on mobile, visible md+ */}
      <ul className="hidden md:flex gap-8 list-none">
        <li>
          <a
            href="#"
            className="text-sm text-gray-500 font-medium hover:text-gray-900"
          >
            Work
          </a>
        </li>
        <li>
          <a
            href="#"
            className="text-sm text-gray-500 font-medium hover:text-gray-900"
          >
            About
          </a>
        </li>
        <li>
          <a
            href="#"
            className="text-sm text-gray-500 font-medium hover:text-gray-900"
          >
            Contact
          </a>
        </li>
      </ul>

      {/* CTA — hidden on mobile, visible md+ */}
      <button className="hidden md:block bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-indigo-600 transition-colors">
        Let's Talk
      </button>
    </nav>
  );
}

export default Navbar;
