import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';

const PremiumNavbar = ({ currentPage, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Features', id: 'features' },
    { name: 'Architecture', id: 'architecture' },
    { name: 'Security', id: 'security' },
  ];

  // Helper to handle navigation: if on homepage, scroll to section; if elsewhere, navigate to home then scroll.
  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    if (currentPage === 'home') {
       if (id === 'home') {
           window.scrollTo({ top: 0, behavior: 'smooth' });
       } else {
           const el = document.getElementById(id);
           if (el) el.scrollIntoView({ behavior: 'smooth' });
       }
    } else {
       // If we're on auth page or elsewhere, just navigate to home
       onNavigate('home');
       setTimeout(() => {
           if (id !== 'home') {
               const el = document.getElementById(id);
               if (el) el.scrollIntoView({ behavior: 'smooth' });
           }
       }, 500);
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'py-4 bg-[#050505]/70 backdrop-blur-xl border-b border-[rgba(69,216,241,0.1)] shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => handleNavClick('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1857c8] to-[#6c3ef4] flex items-center justify-center shadow-[0_0_15px_rgba(108,62,244,0.5)] group-hover:shadow-[0_0_25px_rgba(69,216,241,0.8)] transition-all duration-300">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#45d8f1] transition-colors">
            Lattice<span className="font-light">Link</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="text-sm font-medium text-gray-300 hover:text-white relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-px bg-gradient-to-r from-[#45d8f1] to-[#6c3ef4] transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_10px_rgba(69,216,241,0.8)]"></span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => onNavigate('auth')}
            className="text-sm font-bold text-white hover:text-[#45d8f1] transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => onNavigate('auth')}
            className="px-6 py-2 rounded-full bg-white/10 border border-white/20 hover:border-[#45d8f1] hover:bg-[#45d8f1]/10 text-white text-sm font-bold transition-all shadow-[0_0_0_rgba(69,216,241,0)] hover:shadow-[0_0_15px_rgba(69,216,241,0.4)]"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="text-left text-lg font-medium text-gray-300 hover:text-white"
                >
                  {link.name}
                </button>
              ))}
              <hr className="border-white/10 my-2" />
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('auth'); }}
                className="text-left text-lg font-bold text-white"
              >
                Login
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('auth'); }}
                className="w-full py-3 rounded-full bg-[#1857c8] text-white text-lg font-bold text-center"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default PremiumNavbar;
