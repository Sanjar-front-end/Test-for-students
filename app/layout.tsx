import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Биология тестілеу порталы | Онлайн емтихан',
  description: 'Өсімдіктер мен жануарлардағы гаметогенез және спорогенез тақырыбы бойынша биология тестілеу жүйесі.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Subtle ambient glowing orbs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
