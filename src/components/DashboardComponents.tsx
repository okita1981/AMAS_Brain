import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, ChevronRight, Info } from 'lucide-react';
import { Agent, AgentType } from '../types';

export function MetricCard({ label, value, trend, icon, tooltip, subValue, progress }: { label: string, value: string, trend?: string, icon: React.ReactNode, tooltip?: string, subValue?: string, progress?: number }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : trend.startsWith('-') ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      
      <div className="mt-4">
        {progress !== undefined && (
          <div className="w-full bg-gray-100 rounded-full h-1 mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-black rounded-full"
            />
          </div>
        )}
        {subValue && <p className="text-[10px] text-gray-400 font-medium">{subValue}</p>}
      </div>

      {tooltip && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Info size={14} className="text-gray-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded-lg hidden group-hover:block z-50">
              {tooltip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentCard({ agent, active, onClick }: { agent: Agent, active: boolean, onClick: () => void }) {
  const getAgentColor = (type: AgentType) => {
    switch (type) {
      case 'SEO': return 'bg-blue-500';
      case 'Ads': return 'bg-purple-500';
      case 'LPO': return 'bg-emerald-500';
      case 'CRM': return 'bg-orange-500';
      case 'Orchestrator': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
        active 
          ? 'bg-white border-black shadow-xl scale-[1.02] z-10' 
          : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${getAgentColor(agent.type)}`}>
          <Zap size={20} className={active ? 'animate-pulse' : ''} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">{agent.name}</h4>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{agent.type} Agent</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
        {agent.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{agent.status}</span>
        </div>
        <ChevronRight size={14} className={`transition-transform duration-300 ${active ? 'translate-x-1' : 'opacity-0'}`} />
      </div>
    </button>
  );
}
