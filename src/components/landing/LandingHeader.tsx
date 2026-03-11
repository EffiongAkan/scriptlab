
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const LandingHeader: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { name: "Features", path: "/features" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "Industries", path: "/industries" },
        { name: "Pricing", path: "/pricing" }
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-3"
                : "bg-transparent py-5"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-white p-1 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                        <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-8 w-auto min-w-[32px]" />
                    </div>
                    <span className="text-white font-bold text-2xl tracking-tight">ScriptLab</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className="text-gray-300 hover:text-naija-gold font-medium text-sm transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* desktop auth buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        to="/auth"
                        className="text-white hover:text-naija-gold font-medium text-sm transition-colors px-4"
                    >
                        Log In
                    </Link>
                    <Button
                        asChild
                        className="bg-naija-green hover:bg-naija-green/90 text-white font-bold px-6 rounded-lg transition-all hover:scale-105 active:scale-95"
                    >
                        <Link to="/auth">Start Writing</Link>
                    </Button>
                </div>

                {/* Mobile menu toggle */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Nav */}
            <div
                className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="p-6 flex flex-col gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className="text-gray-300 hover:text-naija-gold font-medium text-lg"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                        <Link
                            to="/auth"
                            className="text-white font-medium text-lg py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Log In
                        </Link>
                        <Button
                            asChild
                            className="bg-naija-green text-white font-bold py-6 text-lg"
                        >
                            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                                Start Writing
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
