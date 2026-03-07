export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col">
        <h1 className="text-6xl font-bold text-amber-500 mb-8 border-b-2 border-amber-600 pb-2">
          D&D VAULT
        </h1>
        <p className="text-xl italic text-slate-400">
          "L'aventure commence ici, au creux du code."
        </p>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border border-slate-700 rounded-xl bg-slate-900 hover:border-amber-500 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-2">Fiche de Personnage 👤</h2>
            <p className="text-slate-400 text-sm">Gère tes stats, tes PV et ton équipement.</p>
          </div>
          
          <div className="p-6 border border-slate-700 rounded-xl bg-slate-900 hover:border-amber-500 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-2">Grimoire de Sorts ✨</h2>
            <p className="text-slate-400 text-sm">Consulte l'encyclopédie des sorts de l'API.</p>
          </div>
        </div>
      </div>
    </main>
  );
}