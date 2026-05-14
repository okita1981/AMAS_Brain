import React from 'react';

export function NavItem({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-black text-white shadow-lg shadow-black/10' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-black'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold tracking-tight ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
          {label}
        </span>
      </div>
      {badge !== undefined && badge > 0 && (
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
          active ? 'bg-white text-black' : 'bg-black text-white'
        }`}>
          {badge}
        </div>
      )}
    </button>
  );
}
