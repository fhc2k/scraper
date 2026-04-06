'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import CEPForm from '@/components/CEPForm';
import CEPResults from '@/components/CEPResults';
import APIDocs from '@/components/APIDocs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
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

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-3xl">
          {/* Form — always mounted, hidden when loading/results */}
          <div className={queryStatus !== 'idle' ? 'hidden' : ''}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
