import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("dnd-vault");
    
    // On cherche la campagne par son ID
    const campaign = await db.collection("campaigns").findOne({ 
      _id: new ObjectId(id) 
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}