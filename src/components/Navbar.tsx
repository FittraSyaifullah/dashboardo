import { Moon, User, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0d1117]/90 backdrop-blur-md border-b border-[#2d6a4f]/30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#0d1117] flex items-center justify-center border border-[#40916c]">
          <Moon className="w-5 h-5 text-[#74c69d] fill-[#74c69d]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Masjid Ar-Raudhah</h1>
          <p className="text-xs text-[#74c69d] font-medium tracking-wide uppercase">Skim Pintar Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-[#161b22] text-gray-400 hover:text-[#74c69d] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  );
}
