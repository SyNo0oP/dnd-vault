import { NextResponse } from 'next/server';
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

// 📥 RÉCUPÉRER (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("dndvault");
    const characters = await db.collection("characters")
      .find({ userId: email })
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(characters);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 📤 CRÉER (POST)
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("dndvault");
    const body = await request.json();
    
    const character = await db.collection("characters").insertOne({ 
      ...body, 
      createdAt: new Date() 
    });
    
    return NextResponse.json({ success: true, id: character.insertedId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 🆙 MODIFIER (PUT)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("dndvault");
    const body = await request.json();

    // On retire le _id pour éviter l'erreur d'immuabilité de MongoDB
    const { _id, ...updateData } = body;

    const result = await db.collection("characters").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: result.modifiedCount > 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 🗑️ SUPPRIMER (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || id === 'undefined') return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("dndvault");
    const result = await db.collection("characters").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: result.deletedCount > 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}