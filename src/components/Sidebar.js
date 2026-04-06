'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ activeTab = 'dashboard', onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'help', label: 'Ayuda', icon: HelpCircle },
  ];

  return (
    <div className="w-64 h-screen bg-[#0a0a0a] border-r border-white/5 flex flex-col hidden md:flex sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-tight">CEP Banxico</span>
          <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">SaaS Edition</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-white/5 text-white" 
                : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-blue-500" : "group-hover:text-gray-300"
              )} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {activeTab === item.id && (
              <ChevronRight size={14} className="text-blue-500" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/10 mb-4">
          <p className="text-xs text-gray-400 mb-2">Plan Actual</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Free Plan</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">PROX</span>
          </div>
        </div>
        
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-400/5">
          <LogOut size={20} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
