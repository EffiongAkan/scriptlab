
import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Mail } from "lucide-react";

export const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-[#0a0a0a] pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <div className="bg-white p-1 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                                <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-6 w-auto min-w-[24px]" />
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">ScriptLab</span>
                        </Link>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
                            The AI-powered screenwriting studio built for filmmakers, writers, and creators worldwide. Rooted in African storytelling, reaching the global screen.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://x.com/script_lap"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="X (Twitter)"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a
                                href="https://instagram.com/scriptlap"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-naija-green/20 hover:text-naija-green transition-all"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://tiktok.com/@scriptlap"
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
                                href="mailto:info@scriptlap.net"
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
                            {["About", "Contact", "Privacy", "Terms"].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-500 hover:text-naija-gold text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-xs">
                    <p>© {new Date().getFullYear()} ScriptLab Studio. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="#" className="hover:text-gray-400">Cookie Policy</Link>
                        <Link to="#" className="hover:text-gray-400">Legal Notice</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
