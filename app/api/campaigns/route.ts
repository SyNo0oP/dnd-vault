import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET : Récupérer les campagnes d'un utilisateur
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("dnd-vault");
    
    const campaigns = await db.collection("campaigns")
      .find({ creatorEmail: email })
      .toArray();

    return NextResponse.json(campaigns);
  } catch (e) {
    return NextResponse.json({ error: "Erreur fetch" }, { status: 500 });
  }
}

// POST : Créer une nouvelle campagne
export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("dnd-vault");
    const body = await req.json();

    const result = await db.collection("campaigns").insertOne({
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}

// DELETE : Supprimer une campagne
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const client = await clientPromise;
    const db = client.db("dnd-vault");

    await db.collection("campaigns").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Supprimée avec succès" });
  } catch (e) {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
export async function PATCH(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("dnd-vault");
    const { id, ...updateData } = await req.json();

    // On retire le _id des données à mettre à jour pour éviter les erreurs MongoDB
    delete (updateData as any)._id;

    await db.collection("campaigns").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}