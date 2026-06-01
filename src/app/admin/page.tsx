"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Activity, ChevronLeft, RefreshCcw, Cpu, ShieldCheck } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";

export default function AdminLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/api/logs/');
            setLogs(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300 font-mono p-6 pb-20">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 pt-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-xl text-slate-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-white font-bold flex items-center gap-2">
                            <Terminal size={18} className="text-emerald-400" /> System Logs
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">Live Traffic Monitoring</p>
                    </div>
                </div>
                <button onClick={fetchLogs} className={`p-3 bg-slate-800 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCcw size={18} />
                </button>
            </header>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <MetricCard icon={<Activity size={14} />} label="Requests (100)" value={logs.length} color="text-blue-400" />
                <MetricCard icon={<Cpu size={14} />} label="Avg Latency" value="142ms" color="text-emerald-400" />
            </div>

            {/* Log Table */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/50 text-slate-500 uppercase text-[9px] tracking-widest">
                        <tr>
                            <th className="p-4">Method</th>
                            <th className="p-4">Path</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">User</th>
                            <th className="p-4 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9px] ${log.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                                            log.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-slate-700/30 text-slate-400'
                                        }`}>
                                        {log.method}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400 max-w-[150px] truncate">{log.path}</td>
                                <td className="p-4">
                                    <span className={log.status >= 400 ? 'text-rose-400' : 'text-emerald-400'}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-slate-200">{log.userName}</td>
                                <td className="p-4 text-right text-slate-500">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex justify-center items-center gap-2 opacity-20">
                <ShieldCheck size={14} />
                <span className="text-[10px] uppercase tracking-widest font-black">Encrypted Ledger</span>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                {icon} {label}
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
    );
}