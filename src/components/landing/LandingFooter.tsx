
import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Mail, Youtube } from "lucide-react";

export const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-[#0a0a0a] pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-3 mb-6 group">
                            <img src="/brand/logo.png" alt="Scriptyn Logo" className="h-8 w-auto min-w-[32px] transition-all duration-300 group-hover:scale-110" />
                            <span className="text-white font-extrabold text-2xl tracking-tighter transition-colors group-hover:text-naija-gold">Scriptyn</span>
                        </Link>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
                            The AI-powered screenwriting studio built for filmmakers, writers, and creators worldwide.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://x.com/Scriptyn_script"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="X (Twitter)"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a
                                href="https://instagram.com/scriptyn_app"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://tiktok.com/@scriptyn"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TikTok"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </a>
                            <a
                                href="https://youtube.com/@scriptyn"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="YouTube"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Youtube className="h-5 w-5" />
                            </a>
                            <a
                                href="mailto:support@scriptyn.com"
                                aria-label="Email"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="space-y-4">
                            {["Features", "Industries", "Pricing", "Updates"].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-500 hover:text-naija-gold text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Resources</h4>
                        <ul className="space-y-4">
                            {["Blog", "Sample Scripts", "Help Center", "Community"].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-500 hover:text-naija-gold text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4">
                            {[
                                { name: "About", path: "#" },
                                { name: "Contact", path: "#" },
                                { name: "Privacy", path: "/privacy-policy" },
                                { name: "Terms", path: "/terms-of-use" }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-gray-500 hover:text-naija-gold text-sm transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-xs">
                    <p>© {new Date().getFullYear()} Scriptyn Studio. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="/privacy-policy" className="hover:text-gray-400">Privacy Policy</Link>
                        <Link to="/terms-of-use" className="hover:text-gray-400">Terms of Use</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
