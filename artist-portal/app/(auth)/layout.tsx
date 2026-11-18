import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Admin Portal Ambient Glow Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-200/20 rounded-full animate-pulse delay-700 pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-cyan-100/20 rounded-full animate-pulse delay-1000 pointer-events-none" />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        {children}
      </main>
    </div>
  );
}
