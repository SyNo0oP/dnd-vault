import { NextResponse } from 'next/server';
import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    // On attend que la connexion s'établisse
    const client = await clientPromise;
    const db = client.db("dndvault");
    
    // On tente une opération simple
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({ 
      status: "Succès ! ⚔️",
      message: "Ton site communique officiellement avec MongoDB Atlas.",
      database: "dndvault"
    });
  } catch (e: any) {
    console.error("Erreur de connexion :", e);
    return NextResponse.json({ 
      status: "Erreur", 
      message: "La connexion a échoué. Vérifie ton mot de passe dans .env.local",
      error: e.message 
    }, { status: 500 });
  }
}