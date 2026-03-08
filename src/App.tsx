/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import DonatorTable from './components/DonatorTable';
import IncomingTable from './components/IncomingTable';
import DonatorDrawer from './components/DonatorDrawer';
import { MOCK_CURRENT_DONATORS, MOCK_INCOMING_DONATORS, Donator, IncomingDonator } from './data';
import { motion } from 'motion/react';

type NotificationKind = 'expiring_soon' | 'renew_now';

export default function App() {
  const [activeTab, setActiveTab] = useState<'current' | 'incoming' | 'deactivated'>('current');
  const [currentDonators, setCurrentDonators] = useState<Donator[]>(MOCK_CURRENT_DONATORS);
  const [incomingDonators, setIncomingDonators] = useState<IncomingDonator[]>(MOCK_INCOMING_DONATORS);
  const [selectedDonator, setSelectedDonator] = useState<Donator | null>(null);
  const [syncNotice, setSyncNotice] = useState<string>(' ');

  const applyServerState = (payload: { currentDonators: Donator[]; incomingDonators: IncomingDonator[] }) => {
    setCurrentDonators(payload.currentDonators);
    setIncomingDonators(payload.incomingDonators);
    setSelectedDonator((prev) => {
      if (!prev) return prev;
      return payload.currentDonators.find((d) => d.id === prev.id) || null;
    });
  };

  const fetchServerState = async () => {
    const response = await fetch('/api/donators');
    if (!response.ok) {
      throw new Error('Failed to load API state');
    }
    const payload = await response.json();
    if (payload?.ok) {
      applyServerState(payload);
    }
  };

  const sendAction = async (action: object) => {
    const response = await fetch('/api/donators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!response.ok) {
      throw new Error('Action failed');
    }
    const payload = await response.json();
    if (payload?.ok) {
      applyServerState(payload);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await fetchServerState();
        if (isMounted) {
          setSyncNotice('Synced with /api/donators');
        }
      } catch {
        if (isMounted) {
          setSyncNotice(' ');
        }
      }
    };

    bootstrap();
    const intervalId = window.setInterval(() => {
      void fetchServerState().catch(() => {
        // Ignore polling errors in MVP mode.
      });
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const activeDonators = currentDonators.filter(d => d.status === 'Active');
  const inactiveDonators = currentDonators.filter(d => d.status === 'Inactive');

  const handleDeactivate = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this donator?')) {
      void sendAction({ type: 'deactivate', id }).catch(() => {
        setCurrentDonators(prev => prev.map(d =>
          d.id === id ? { ...d, status: 'Inactive' } : d
        ));
      });
    }
  };

  const handleReactivate = (id: string) => {
    void sendAction({ type: 'reactivate', id }).catch(() => {
      setCurrentDonators(prev => prev.map(d =>
        d.id === id ? { ...d, status: 'Active' } : d
      ));
    });
  };

  const handleApproveIncoming = (id: string) => {
    void sendAction({ type: 'approve', id }).then(() => {
      setActiveTab('current');
    }).catch(() => {
      const incoming = incomingDonators.find(d => d.id === id);
      if (incoming) {
        const newDonator: Donator = {
          id: incoming.id,
          name: incoming.name,
          tier: incoming.tier,
          discount: incoming.discount,
          membershipLength: incoming.membershipLength,
          membershipDateEnd: incoming.membershipDateEnd,
          monthlyAmount: incoming.tier === 'Individual' ? 50 : 100,
          status: 'Active',
          bounces: 0,
          history: []
        };
        setCurrentDonators(prev => [newDonator, ...prev]);
        setIncomingDonators(prev => prev.filter(d => d.id !== id));
        setActiveTab('current');
      }
    });
  };

  const handleRejectIncoming = (id: string) => {
    if (window.confirm('Are you sure you want to remove this application?')) {
      void sendAction({ type: 'reject', id }).catch(() => {
        setIncomingDonators(prev => prev.filter(d => d.id !== id));
      });
    }
  };

  const handleSendNotification = (id: string, kind: NotificationKind) => {
    const actionLabel = kind === 'expiring_soon' ? 'expiry reminder' : 'renewal reminder';
    void sendAction({ type: 'notify', id, kind }).then(() => {
      setSyncNotice(`Sent ${actionLabel} for donator ${id}`);
    }).catch(() => {
      setSyncNotice(`Failed to send ${actionLabel} for donator ${id}`);
    });
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
            <p className="text-xs text-gray-500 mt-2">{syncNotice}</p>
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
                onSendNotification={handleSendNotification}
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
                onSendNotification={handleSendNotification}
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
