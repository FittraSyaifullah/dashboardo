/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Navbar from './components/Navbar';
import DonatorTable from './components/DonatorTable';
import IncomingTable from './components/IncomingTable';
import DonatorDrawer from './components/DonatorDrawer';
import { MOCK_CURRENT_DONATORS, MOCK_INCOMING_DONATORS, Donator, IncomingDonator } from './data';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'current' | 'incoming' | 'deactivated'>('current');
  const [currentDonators, setCurrentDonators] = useState<Donator[]>(MOCK_CURRENT_DONATORS);
  const [incomingDonators, setIncomingDonators] = useState<IncomingDonator[]>(MOCK_INCOMING_DONATORS);
  const [selectedDonator, setSelectedDonator] = useState<Donator | null>(null);

  const activeDonators = currentDonators.filter(d => d.status === 'Active');
  const inactiveDonators = currentDonators.filter(d => d.status === 'Inactive');

  const handleDeactivate = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this donator?')) {
      setCurrentDonators(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'Inactive' } : d
      ));
    }
  };

  const handleReactivate = (id: string) => {
    setCurrentDonators(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'Active' } : d
    ));
  };

  const handleApproveIncoming = (id: string) => {
    const incoming = incomingDonators.find(d => d.id === id);
    if (incoming) {
      const newDonator: Donator = {
        id: incoming.id,
        name: incoming.name,
        tier: incoming.tier,
        discount: incoming.discount,
        monthlyAmount: incoming.tier === 'Individual' ? 50 : 100, // Default amounts
        status: 'Active',
        bounces: 0,
        history: []
      };
      setCurrentDonators(prev => [newDonator, ...prev]);
      setIncomingDonators(prev => prev.filter(d => d.id !== id));
      // Switch to current tab to show the new user
      setActiveTab('current');
    }
  };

  const handleRejectIncoming = (id: string) => {
    if (window.confirm('Are you sure you want to remove this application?')) {
      setIncomingDonators(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Navbar />
      
      <main className="space-y-8">
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Donator Management</h2>
            <p className="text-gray-400 mt-1">Manage Skim Pintar subscriptions and applications.</p>
          </div>
          
          <div className="bg-[#161b22] p-1 rounded-lg border border-gray-800 flex items-center overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('current')}
              className={`relative px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'current' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeTab === 'current' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#2d6a4f] rounded-md shadow-lg shadow-[#2d6a4f]/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Current Donators</span>
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`relative px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'incoming' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeTab === 'incoming' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#2d6a4f] rounded-md shadow-lg shadow-[#2d6a4f]/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                Incoming Donators
                {incomingDonators.length > 0 && (
                  <span className="bg-[#74c69d] text-[#0d1117] text-xs font-bold px-1.5 rounded-full">
                    {incomingDonators.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('deactivated')}
              className={`relative px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'deactivated' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeTab === 'deactivated' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#2d6a4f] rounded-md shadow-lg shadow-[#2d6a4f]/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                Deactivated
                {inactiveDonators.length > 0 && (
                  <span className="bg-gray-700 text-gray-300 text-xs font-bold px-1.5 rounded-full">
                    {inactiveDonators.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[500px]">
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DonatorTable 
                donators={activeDonators} 
                onSelectDonator={setSelectedDonator}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
              />
            </motion.div>
          )}
          
          {activeTab === 'incoming' && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <IncomingTable 
                donators={incomingDonators}
                onApprove={handleApproveIncoming}
                onReject={handleRejectIncoming}
              />
            </motion.div>
          )}

          {activeTab === 'deactivated' && (
            <motion.div
              key="deactivated"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DonatorTable 
                donators={inactiveDonators} 
                onSelectDonator={setSelectedDonator}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
              />
            </motion.div>
          )}
        </div>
      </main>

      <DonatorDrawer 
        donator={selectedDonator} 
        onClose={() => setSelectedDonator(null)} 
      />
    </div>
  );
}
