import { X, Check, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Donator } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface DonatorDrawerProps {
  donator: Donator | null;
  onClose: () => void;
}

export default function DonatorDrawer({ donator, onClose }: DonatorDrawerProps) {
  return (
    <AnimatePresence>
      {donator && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#161b22] border-l border-[#2d6a4f]/30 shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="p-6 space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight">{donator.name}</h2>
                  <p className="text-sm text-gray-500 font-mono mt-1">ID: {donator.id}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tier</p>
                  <p className="text-lg font-medium text-white">{donator.tier}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Discount</p>
                  <p className={`text-lg font-medium ${donator.discount ? 'text-[#74c69d]' : 'text-gray-400'}`}>
                    {donator.discount ? 'Active (50%)' : 'None'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monthly</p>
                  <p className="text-lg font-medium text-white font-mono">SGD {donator.monthlyAmount}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${donator.status === 'Active' ? 'bg-[#74c69d]' : 'bg-gray-500'}`}></span>
                    <p className="text-lg font-medium text-white">{donator.status}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Payment History (Last 12 Months)
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin">
                  {donator.history.map((record, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                        record.status === 'Paid' 
                          ? 'bg-[#2d6a4f]/20 border-[#2d6a4f]/50 text-[#74c69d]' 
                          : record.status === 'Bounced'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}>
                        {record.status === 'Paid' ? <Check className="w-5 h-5" /> : 
                         record.status === 'Bounced' ? <XCircle className="w-5 h-5" /> : 
                         <div className="w-2 h-2 rounded-full bg-gray-600"></div>}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{record.date.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Audit Log</h3>
                <div className="space-y-2">
                  {donator.history.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          record.status === 'Paid' ? 'bg-[#74c69d]' : 
                          record.status === 'Bounced' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{record.date}</p>
                          <p className="text-xs text-gray-500">{record.status === 'Paid' ? 'Successful Payment' : record.status === 'Bounced' ? 'Payment Failed (Insufficient Funds)' : 'No Transaction'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">SGD {record.amount}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{record.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
