import { Link } from 'react-router-dom';
import { Globe, Share2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-on-background text-surface w-full border-t border-white/5 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="text-2xl font-bold text-primary-fixed inline-block hover:opacity-90 transition-opacity">
              NestMate<span className="text-primary-container">.</span>
            </Link>
            <p className="text-xs text-surface-variant/60 leading-relaxed max-w-sm">
              Connecting students with the best living spaces near their educational institutions. Reliable, safe, and convenient.
            </p>
          </div>

          {/* Col 2, 3, 4 */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h5 className="font-bold text-xs tracking-widest uppercase text-white/40">Company</h5>
              <div className="flex flex-col gap-2.5 text-xs text-surface-variant/80">
                <Link to="/browse" className="hover:text-white transition-colors">About Us</Link>
                <Link to="/browse" className="hover:text-white transition-colors">Careers</Link>
                <Link to="/browse" className="hover:text-white transition-colors">Press</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-xs tracking-widest uppercase text-white/40">Support</h5>
              <div className="flex flex-col gap-2.5 text-xs text-surface-variant/80">
                <Link to="/browse" className="hover:text-white transition-colors">FAQ</Link>
                <Link to="/browse" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/browse" className="hover:text-white transition-colors">Privacy Policy</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-xs tracking-widest uppercase text-white/40">Social</h5>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-all text-white/80 hover:text-white"
                  title="Website"
                >
                  <Globe className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-all text-white/80 hover:text-white"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-surface-variant/40">
            © 2024 NestMate. Built for the modern student.
          </p>
          <div className="flex items-center gap-1.5 text-surface-variant/40 text-xs">
            <span>Hand-coded with</span>
            <Heart className="h-3.5 w-3.5 fill-primary text-primary inline" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
