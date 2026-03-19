import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from "next-auth/next";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Vérifie bien ce chemin selon ton projet

// GET : Récupérer les campagnes d'un utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("Recherche de campagnes pour :", session.user.email);

    const client = await clientPromise;
    const db = client.db("dnd-vault");

    const campaigns = await db
      .collection("campaigns")
      .find({ creatorEmail: session.user.email })
      .toArray();

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Erreur GET campaigns:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Créer une nouvelle campagne
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("dnd-vault");
    const body = await req.json();

    // On s'assure que creatorEmail est bien présent même si le front l'envoie
    const result = await db.collection("campaigns").insertOne({
      ...body,
      creatorEmail: session.user.email,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await req.json();
    const client = await clientPromise;
    const db = client.db("dnd-vault");

    // Sécurité : On vérifie l'ID ET le créateur pour éviter qu'un autre supprime ta campagne
    await db.collection("campaigns").deleteOne({ 
      _id: new ObjectId(id),
      creatorEmail: session.user.email 
    });

    return NextResponse.json({ message: "Supprimée avec succès" });
  } catch (e) {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

// PATCH : Mettre à jour une campagne
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("dnd-vault");
    const { id, ...updateData } = await req.json();

    // Nettoyage des données sensibles
    delete (updateData as any)._id;
    delete (updateData as any).creatorEmail; // On ne change pas le propriétaire

    const result = await db.collection("campaigns").updateOne(
      { _id: new ObjectId(id), creatorEmail: session.user.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}