'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function CreateCharacter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    Force: 10, Dextérité: 10, Constitution: 10,
    Intelligence: 10, Sagesse: 10, Charisme: 10
  });

  const handleSave = async () => {
    if (!session) {
      alert("Connecte-toi pour sauvegarder !");
      return;
    }

    setLoading(true);

    const characterData = {
      userId: session.user?.email, // On lie le perso à l'email de l'utilisateur
      name: name || "Aventurier Anonyme",
      stats: stats,
      level: 1,
    };

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterData),
      });

      if (response.ok) {
        alert("Héros gravé dans la roche ! ⚔️");
        router.push('/characters'); // On redirige vers la liste
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error(error);
      alert("Le sort a échoué... réessaie !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/characters" className="text-amber-500 hover:underline mb-8 inline-block">
          ← Retour à la taverne
        </Link>

        <div className="bg-slate-900 border-2 border-amber-900/50 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-black text-amber-500 uppercase mb-8">Nouveau Héros</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Nom du héros..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500"
              />
              
              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "INCANTATION EN COURS..." : "SAUVEGARDER DANS MONGO"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">{key}</span>
                  <span className="text-xl font-bold">{value}</span>
                  <div className="flex flex-col">
                    <button onClick={() => setStats({...stats, [key]: value + 1})} className="text-xs hover:text-amber-400">+</button>
                    <button onClick={() => setStats({...stats, [key]: value - 1})} className="text-xs hover:text-amber-400">-</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}