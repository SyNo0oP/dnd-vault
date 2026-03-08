import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // Assure-toi que le chemin vers ton client mongo est bon

export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("ton_nom_de_bdd"); // Remplace par le nom de ta BDD
    const body = await req.json();

    const result = await db.collection("campaigns").insertOne(body);

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de la création de la campagne" }, { status: 500 });
  }
}

// On ajoute aussi le GET pour que le MJ puisse voir ses parties plus tard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    const client = await clientPromise;
    const db = client.db("ton_nom_de_bdd");
    
    const campaigns = await db.collection("campaigns")
      .find({ creatorEmail: email })
      .toArray();

    return NextResponse.json(campaigns);
  } catch (e) {
    return NextResponse.json({ error: "Erreur fetch" }, { status: 500 });
  }
}