'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import CEPForm from '@/components/CEPForm';
import CEPResults from '@/components/CEPResults';
import APIDocs from '@/components/APIDocs';
import HistoryDashboard from '@/components/HistoryDashboard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'history'
  const [queryStatus, setQueryStatus] = useState('idle'); // 'idle', 'submitting', 'result'
  const [resultData, setResultData] = useState(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleFormSubmit = async (data) => {
    setQueryStatus('submitting');

    try {
      const params = new URLSearchParams(data).toString();
      const response = await fetch(`/api/cep?${params}`);
      const result = await response.json();

      if (result.success) {
        setResultData(result.data);
        setQueryStatus('result');
        toast.success('Consulta exitosa', {
          description: 'El comprobante electrónico de pago fue validado correctamente.',
        });

        // ── SAVE TO PRIVATE LOCAL HISTORY ──
        try {
          const currentHistory = JSON.parse(localStorage.getItem('cepHistory') || '[]');
          const newHistoryItem = { ...result.data, _local_timestamp: Date.now() };
          // Remove duplicates of the same transaction ID
          const filteredHistory = currentHistory.filter(h => h.id_transaccion !== result.data.id_transaccion);
          filteredHistory.unshift(newHistoryItem);
          localStorage.setItem('cepHistory', JSON.stringify(filteredHistory.slice(0, 15)));
        } catch (e) {
          console.warn('Failed to save history to local storage', e);
        }
      } else {
        toast.error('Error en la consulta', {
          description: result.message || 'No se pudo procesar la solicitud. Verifica los datos e intenta de nuevo.',
        });
        setQueryStatus('idle');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      });
      setQueryStatus('idle');
    }
  };

  const handleBack = () => {
    setQueryStatus('idle');
  };

  const handleHistorySelect = (data) => {
    // Treat historical selection exactly like a successful result
    setResultData(data);
    setQueryStatus('result');
  };

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-3xl">
          {/* Top Level Tabs */}
          {queryStatus === 'idle' && (
            <div className="flex bg-[#111] p-1 rounded-2xl border border-white/10 mb-8 max-w-[280px] mx-auto shadow-2xl relative z-10">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'new' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Nueva Consulta
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Historial
              </button>
            </div>
          )}

          {/* Form / History Dashboard — always mounted, hidden when loading/results */}
          <div className={queryStatus !== 'idle' ? 'hidden' : ''}>
            <AnimatePresence mode="wait">
              {activeTab === 'new' ? (
                <motion.div
                  key="new-query"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      Consulta de Pago SPEI
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                      Valida tu Comprobante Electrónico de Pago ingresando los datos de tu transacción
                    </p>
                  </div>

                  <CEPForm onSubmit={handleFormSubmit} />

                  <APIDocs />
                </motion.div>
              ) : (
                <motion.div
                  key="history-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <HistoryDashboard onSelect={handleHistorySelect} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Loading / Results — animated */}
          <AnimatePresence mode="wait">
            {queryStatus === 'submitting' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                    <Search size={30} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Procesando Consulta</h3>
                <p className="text-gray-500 text-sm text-center max-w-sm">
                  Conectando con los servidores de Banxico para verificar tu transacción...
                </p>
              </motion.div>
            )}

            {queryStatus === 'result' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <CEPResults data={resultData} onBack={handleBack} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
