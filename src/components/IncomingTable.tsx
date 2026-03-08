import { useState } from 'react';
import { Check, X, Search, Filter, Clock, Smartphone } from 'lucide-react';
import { IncomingDonator } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface IncomingTableProps {
  donators: IncomingDonator[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function IncomingTable({ donators, onApprove, onReject }: IncomingTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDonators = donators.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.id.includes(searchQuery)
  );

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#161b22] p-4 rounded-xl border border-[#2d6a4f]/20 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#74c69d] transition-colors" />
          <input 
            type="text" 
            placeholder="Search incoming applications..." 
            className="w-full bg-[#0d1117] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] transition-all placeholder:text-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0d1117] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#2d6a4f]/50 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] rounded-xl border border-[#2d6a4f]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0d1117]/50 text-xs uppercase tracking-wider text-gray-500 font-medium">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              <AnimatePresence>
                {filteredDonators.map((donator) => (
                  <motion.tr 
                    key={donator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group hover:bg-[#2d6a4f]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white group-hover:text-[#74c69d] transition-colors">{donator.name}</div>
                      <div className="text-xs text-gray-600 font-mono">ID: {donator.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {donator.tier === 'Individual' ? (
                        <span className="inline-flex px-2 py-1 rounded border border-gray-700 text-xs text-gray-400 font-medium">Individual</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded bg-[#2d6a4f]/20 text-[#74c69d] border border-[#2d6a4f]/30 text-xs font-medium">Household</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {donator.discount ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#74c69d] font-medium"><Check className="w-3 h-3" /> Discount</span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300 text-sm">
                      {donator.submittedDate}
                    </td>
                    <td className="px-6 py-4">
                      {donator.status === 'Pending Giro' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending Giro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Smartphone className="w-3 h-3" /> Pending e-Giro
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onApprove(donator.id)}
                          className="p-1.5 rounded-lg hover:bg-[#2d6a4f]/20 text-[#74c69d] transition-colors border border-transparent hover:border-[#2d6a4f]/30"
                          title="Mark as Active"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onReject(donator.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                          title="Remove Application"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredDonators.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No applications found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
