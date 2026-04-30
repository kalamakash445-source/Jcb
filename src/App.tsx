import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Download, Plus, Trash2, Clock, FileText, HardHat, ChevronRight } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LogEntry } from './types';
import { exportToPDF, cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('jcb-logs', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [exportEndDate, setExportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{date?: string, hours?: string}>({});

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    const today = format(new Date(), 'yyyy-MM-dd');
    if (newDate > today) {
      setErrors(prev => ({ ...prev, date: 'Date cannot be in the future' }));
    } else {
      setErrors(prev => ({ ...prev, date: undefined }));
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = e.target.value;
    setHours(newHours);
    const numHours = parseFloat(newHours);
    if (newHours && (isNaN(numHours) || numHours <= 0 || numHours > 24)) {
      setErrors(prev => ({ ...prev, hours: 'Hours must be between 0.5 and 24' }));
    } else {
      setErrors(prev => ({ ...prev, hours: undefined }));
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, { start: monthStart, end: monthEnd });
    });

    const totalHoursAllTime = logs.reduce((sum, log) => sum + log.hours, 0);
    const totalHoursMonth = thisMonthLogs.reduce((sum, log) => sum + log.hours, 0);

    return {
      totalHoursAllTime,
      totalHoursMonth
    };
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !hours) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const numHours = parseFloat(hours);
    
    let hasError = false;
    const newErrors = { ...errors };
    
    if (date > today) {
      newErrors.date = 'Date cannot be in the future';
      hasError = true;
    }
    if (isNaN(numHours) || numHours <= 0 || numHours > 24) {
      newErrors.hours = 'Hours must be between 0.5 and 24';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const newEntry: LogEntry = {
      id: uuidv4(),
      date,
      hours: numHours,
      notes,
      createdAt: Date.now(),
    };

    setLogs([newEntry, ...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt));
    
    // Reset form
    setHours('');
    setNotes('');
    setErrors({});
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  const handleExportPDF = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredLogs = logs.filter(log => log.date >= exportStartDate && log.date <= exportEndDate);

    if (filteredLogs.length === 0) {
      alert("No logs found in this date range.");
      return;
    }

    const totalExportHours = filteredLogs.reduce((sum, log) => sum + log.hours, 0);

    const exportData = filteredLogs.map(log => ({
      Date: log.date,
      'Hours Worked': log.hours,
      Notes: log.notes
    }));
    
    exportToPDF(
      exportData, 
      {
        title: 'KAMARAJ JCB - Daily Hours Log',
        filename: `kamaraj-jcb-export-${exportStartDate}-to-${exportEndDate}`,
        periodText: `${format(parseISO(exportStartDate), 'MMM dd, yyyy')} - ${format(parseISO(exportEndDate), 'MMM dd, yyyy')}`,
        totalHours: totalExportHours.toFixed(1)
      }
    );
    
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-yellow-500/30 overflow-x-hidden perspective-1000">
      
      {/* 3D App Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-5xl mx-auto glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-12 h-12 rounded-xl gold-button-3d flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 blur-md transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
              <HardHat className="text-[#3b1a03] w-7 h-7 relative z-10 drop-shadow-sm" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white font-heading leading-tight drop-shadow-md">
                KAMARAJ JCB
              </h1>
              <p className="text-xs text-yellow-500/80 font-medium tracking-widest uppercase">Command Center</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExportModalOpen(true)}
            disabled={logs.length === 0}
            className="px-4 py-2.5 rounded-xl dark-button-3d text-neutral-300 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Export to PDF"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline font-medium text-sm">Download PDF</span>
          </motion.button>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 pb-12 sm:px-6 lg:px-8 space-y-10">
        
        {/* 3D Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            whileHover={{ y: -5, translateZ: 20 }}
            className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
            <p className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Hours (Month)
            </p>
            <p className="text-5xl font-bold text-white font-heading tracking-tighter drop-shadow-lg">
              {stats.totalHoursMonth.toFixed(1)}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="p-[2px] rounded-3xl bg-gradient-to-br from-yellow-500/40 via-yellow-700/20 to-transparent self-stretch"
          >
            <div className="h-full w-full bg-[#111] rounded-[22px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay" />
              <p className="text-sm font-medium text-yellow-500 mb-4 flex items-center gap-2 relative z-10">
                <HardHat className="w-4 h-4" />
                Total Lifetime Hours
              </p>
              <div className="relative z-10 flex items-baseline gap-2">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 font-heading tracking-tighter">
                  {stats.totalHoursAllTime.toFixed(1)}
                </p>
                <span className="text-yellow-700 font-medium">hrs</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Action Header */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="flex items-center justify-between pt-4"
        >
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
             <h2 className="text-2xl font-bold text-white font-heading">Activity Log</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-6 py-3 rounded-xl gold-button-3d font-bold tracking-wide flex items-center gap-2 group"
          >
            <Plus className={cn("w-5 h-5 transition-transform duration-500", isFormOpen && "rotate-[-135deg]")} />
            {isFormOpen ? 'Cancel' : 'Log Hours'}
          </motion.button>
        </motion.div>

        {/* 3D Entry Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, perspective: 1000, rotateX: 20 }}
              animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
              exit={{ height: 0, opacity: 0, rotateX: -20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.6 }}
              className="origin-top"
            >
              <form
                onSubmit={handleSubmit}
                className="glass-panel rounded-3xl p-6 sm:p-10 relative overflow-hidden"
              >
                {/* Decorative background light */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent blur-2xl pointer-events-none" />

                <h3 className="text-xl font-heading font-bold text-white mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </span>
                  Record Shift
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Shift Date</label>
                    <input
                      type="date"
                      id="date"
                      required
                      max={format(new Date(), 'yyyy-MM-dd')}
                      value={date}
                      onChange={handleDateChange}
                      className={cn(
                        "w-full input-3d rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all color-scheme-dark font-medium",
                        errors.date && "ring-1 ring-red-500 focus:ring-red-500"
                      )}
                    />
                    <AnimatePresence>
                      {errors.date && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                          animate={{ opacity: 1, height: 'auto', marginTop: 4 }} 
                          exit={{ opacity: 0, height: 0, marginTop: 0 }} 
                          className="text-xs text-red-400 font-medium ml-1 m-0"
                        >
                          {errors.date}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="hours" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Hours Active</label>
                    <input
                      type="number"
                      id="hours"
                      required
                      min="0.5"
                      max="24"
                      step="0.5"
                      placeholder="e.g. 8.5"
                      value={hours}
                      onChange={handleHoursChange}
                      className={cn(
                        "w-full input-3d rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all font-medium placeholder:text-neutral-600",
                        errors.hours && "ring-1 ring-red-500 focus:ring-red-500"
                      )}
                    />
                    <AnimatePresence>
                      {errors.hours && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                          animate={{ opacity: 1, height: 'auto', marginTop: 4 }} 
                          exit={{ opacity: 0, height: 0, marginTop: 0 }} 
                          className="text-xs text-red-400 font-medium ml-1 m-0"
                        >
                          {errors.hours}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="notes" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Operational Notes / Incidents</label>
                    <div className="relative">
                      <FileText className="w-5 h-5 absolute left-4 top-4 text-neutral-500" />
                      <textarea
                        id="notes"
                        rows={2}
                        placeholder="Any fuel logs, maintenance, or issues..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full input-3d rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all resize-none font-medium placeholder:text-neutral-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-4 relative z-10">
                  <button
                    type="submit"
                    disabled={!!errors.date || !!errors.hours || !date || !hours}
                    className="px-8 py-3.5 rounded-xl gold-button-3d font-bold tracking-wide flex items-center gap-2 group transform transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                  >
                    Commit Entry
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Log List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          {logs.length === 0 ? (
            <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-3xl dark-button-3d flex items-center justify-center mb-6 transform rotate-12 drop-shadow-2xl">
                <FileText className="w-10 h-10 text-neutral-500" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-white mb-3">System Online</h3>
              <p className="text-neutral-400 max-w-sm mb-8 text-lg">No telemetry data recorded yet. Initialize your first shift log below.</p>
              <button
                 onClick={() => setIsFormOpen(true)}
                 className="px-6 py-3 rounded-xl gold-button-3d font-bold tracking-wide transition-transform hover:scale-105 active:scale-95"
              >
                Initialize Log
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="glass-panel p-5 sm:p-6 rounded-2xl group hover:shadow-2xl hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      
                      <div className="flex items-start gap-5">
                        <div className="w-16 h-16 shrink-0 rounded-xl dark-button-3d flex flex-col items-center justify-center text-center leading-none relative overflow-hidden">
                          <div className="absolute top-0 w-full h-1 bg-yellow-500/50" />
                          <span className="text-xs font-bold text-neutral-500 uppercase mb-1">{format(parseISO(log.date), 'MMM')}</span>
                          <span className="text-xl font-bold text-white font-heading">{format(parseISO(log.date), 'dd')}</span>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-bold text-white font-heading tracking-wide">
                            JCB Shift Record
                          </h4>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
                            <span className="flex items-center gap-1.5">
                              <div className="p-1 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                                <Clock className="w-3.5 h-3.5 text-yellow-500" />
                              </div>
                              <span className="font-bold text-neutral-200">{log.hours} <span className="font-normal text-neutral-500">hrs</span></span>
                            </span>
                          </div>
                          {log.notes && (
                            <p className="mt-4 text-sm text-neutral-400/90 leading-relaxed max-w-2xl bg-[#0a0a0a] p-3 rounded-lg border border-white/5 shadow-inner">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-3 rounded-xl input-3d text-neutral-500 hover:text-red-400 hover:border-red-500/30 transition-all hover:shadow-[0_0_15px_rgba(248,113,113,0.2)]"
                          title="Purge Entry"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Footer Disclaimer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs tracking-widest uppercase font-bold text-neutral-600 mt-12 pb-8"
        >
          Encrypted & Stored Locally
        </motion.p>

      </main>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsExportModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md relative z-10"
            >
              <h3 className="text-xl font-heading font-bold text-white mb-6">Export PDF Report</h3>
              <form onSubmit={handleExportPDF} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="exportStartDate" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    id="exportStartDate"
                    required
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full input-3d rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all color-scheme-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="exportEndDate" className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">End Date</label>
                  <input
                    type="date"
                    id="exportEndDate"
                    required
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full input-3d rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all color-scheme-dark font-medium"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl gold-button-3d font-bold tracking-wide flex items-center gap-2 transform transition-transform hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

