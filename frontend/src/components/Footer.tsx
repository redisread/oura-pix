"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <span className="text-sm font-bold text-white">O</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">OuraPix</span>
            </div>
            <p className="mt-4 text-sm text-slate-600 max-w-sm">
              AI-powered cross-border e-commerce product detail page generator
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Product</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/generate" className="text-sm text-slate-600 hover:text-slate-900">
                  Generate
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/docs" className="text-sm text-slate-600 hover:text-slate-900">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/blog" className="text-sm text-slate-600 hover:text-slate-900">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-center text-sm text-slate-500">
            © {currentYear} OuraPix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
