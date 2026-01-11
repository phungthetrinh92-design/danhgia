
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onLogout?: () => void;
  showLogout?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onLogout, showLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {title}
          </h1>
          {showLogout && (
            <button 
              onClick={onLogout}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm shadow-orange-200"
            >
              Đăng xuất
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="bg-white py-12 text-center space-y-2 border-t border-slate-200 mt-20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Hệ Thống Đánh Giá GDTC</p>
        <p className="text-xs text-slate-500 font-medium">Trường PTDTBT TH Số 1 Lùng Thẩn Xã Lùng Phình</p>
      </footer>
    </div>
  );
};

export default Layout;
