'use client';

import React, { useEffect, useState } from 'react';
import { History, Clock, FileText, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function HistoryDashboard({ onSelect }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = () => {
        setLoading(true);
        try {
            // Read from private local storage instead of global database
            const storedHistory = localStorage.getItem('cepHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error('Error fetching private history:', error);
            toast.error('Error leyendo la memoria local');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <History className="text-blue-500" />
                        Historial de Transacciones
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Las 15 transacciones más recientes almacenadas en el sistema.
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="Actualizar Historial"
                >
                    <RefreshCw size={18} className={cn("text-gray-400", loading && "animate-spin")} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <RefreshCw size={32} className="animate-spin mb-4" />
                    <p className="text-sm">Cargando base de datos...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-medium">No hay comprobantes guardados todavía.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((item, idx) => (
                        <button
                            key={item._id || idx}
                            onClick={() => onSelect(item)}
                            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/20 rounded-xl transition-all group text-left gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-white truncate">
                                            $ {parseFloat(item.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                        </span>
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-400 rounded">
                                            {item.estado || 'LIQUIDADO'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5 truncate">
                                            {item.banco_emisor || 'B. Ordenante'} → {item.banco_receptor || 'B. Receptor'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 mt-2 sm:mt-0 px-2 sm:px-0">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 whitespace-nowrap">
                                    <Clock size={12} />
                                    {new Date(item._local_timestamp || item.last_sync || item.createdAt).toLocaleString('es-MX', {
                                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
