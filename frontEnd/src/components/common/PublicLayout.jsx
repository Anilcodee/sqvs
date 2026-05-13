import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Menu, X } from "lucide-react";

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">

      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              SQVS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/verify/search"
              className={`text-sm font-medium transition ${
                location.pathname === "/verify/search"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Verify Certificate
            </Link>

            <Link
              to="/login"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Login
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden text-gray-600"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="flex flex-col px-4 py-4 gap-3">

              <Link
                to="/verify/search"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Verify Certificate
              </Link>

              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg"
              >
                Login
              </Link>

            </div>
          </div>
        )}

      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">SQVS</span>
          </div>

          <p className="text-xs text-center sm:text-left">
            © 2026 Student Qualification Verification System. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default PublicLayout;