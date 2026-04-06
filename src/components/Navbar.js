'use client';

import React from 'react';
import { Shield, FileCheck } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="w-full border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">CEP Validator</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Banxico · SPEI</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">Servicio Activo</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileCheck size={14} />
            <span className="text-[11px] font-medium">v1.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
