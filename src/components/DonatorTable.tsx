import { useState, MouseEvent } from 'react';
import { MoreVertical, Check, AlertTriangle, XCircle, Search, Filter, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Donator } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface DonatorTableProps {
  donators: Donator[];
  onSelectDonator: (donator: Donator) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
}

export default function DonatorTable({ donators, onSelectDonator, onDeactivate, onReactivate }: DonatorTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredDonators = donators.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.id.includes(searchQuery)
  );

  const toggleRow = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getBounceBadge = (count: number) => {
    if (count === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2d6a4f]/20 text-[#74c69d] border border-[#2d6a4f]/30"><div className="w-1.5 h-1.5 rounded-full bg-[#74c69d] animate-pulse"></div>Active</span>;
    if (count === 1) return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle className="w-3 h-3" />Warning</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3" />Danger</span>;
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#161b22] p-4 rounded-xl border border-[#2d6a4f]/20 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#74c69d] transition-colors" />
          <input 
            type="text" 
            placeholder="Search donators..." 
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
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Membership Length (Months)</th>
                <th className="px-6 py-4">Membership Date End</th>
                <th className="px-6 py-4">Monthly Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Bounce Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              <AnimatePresence>
                {filteredDonators.map((donator) => (
                  <>
                    <motion.tr 
                      key={donator.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`group hover:bg-[#2d6a4f]/5 transition-colors cursor-pointer ${donator.status === 'Inactive' ? 'opacity-50 grayscale-[0.5]' : ''}`}
                      onClick={() => onSelectDonator(donator)}
                    >
                      <td className="px-6 py-4">
                        {donator.tier === 'Household' && (
                          <button
                            onClick={(e) => toggleRow(donator.id, e)}
                            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                          >
                            {expandedRows.has(donator.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
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
                      <td className="px-6 py-4 font-mono text-gray-300">
                        {donator.membershipLength}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-300 text-sm">
                        {donator.membershipDateEnd}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-300">
                        SGD {donator.monthlyAmount}
                      </td>
                      <td className="px-6 py-4">
                        {donator.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2d6a4f]/20 text-[#74c69d] border border-[#2d6a4f]/30">Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getBounceBadge(donator.bounces)}
                      </td>
                      <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === donator.id ? null : donator.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuId === donator.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                            <div className="absolute right-8 top-8 z-20 w-32 bg-[#161b22] border border-gray-700 rounded-lg shadow-xl py-1 overflow-hidden">
                              {donator.status === 'Active' ? (
                                <button 
                                  onClick={() => { onDeactivate(donator.id); setActiveMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { onReactivate(donator.id); setActiveMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-[#74c69d] hover:bg-[#2d6a4f]/10 transition-colors"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </motion.tr>
                    {expandedRows.has(donator.id) && donator.householdMembers && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#0d1117]/50"
                      >
                        <td colSpan={10} className="px-6 py-4 border-t border-gray-800/50">
                          <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs font-semibold text-[#74c69d] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Immediate Family
                              </h4>
                              <ul className="space-y-2">
                                {donator.householdMembers
                                  .filter(m => m.relationship === 'Immediate Family')
                                  .map((member, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300 bg-[#161b22] px-3 py-2 rounded-lg border border-gray-800/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#40916c]"></div>
                                      {member.name}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Parents / In-laws
                              </h4>
                              <ul className="space-y-2">
                                {donator.householdMembers
                                  .filter(m => m.relationship === 'Parent/In-law')
                                  .map((member, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-400 bg-[#161b22] px-3 py-2 rounded-lg border border-gray-800/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                      {member.name}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredDonators.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No donators found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
