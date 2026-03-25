import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST : Créer une session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { code, campaignId, status, currentAct, currentSubAct } =
      await req.json();

    if (!code || !campaignId) {
      return NextResponse.json(
        { error: "code et campaignId sont requis" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("dnd-vault");

    // Vérifie que la campagne appartient bien à l'utilisateur connecté
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      creatorEmail: session.user.email,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable ou non autorisée" },
        { status: 403 }
      );
    }

    // Vérifie qu'il n'existe pas déjà une session avec ce code
    const existing = await db.collection("sessions").findOne({ code });
    if (existing) {
      return NextResponse.json(
        { error: "Code de session déjà utilisé" },
        { status: 409 }
      );
    }

    await db.collection("sessions").insertOne({
      code,
      campaignId: new ObjectId(campaignId),
      creatorEmail: session.user.email,
      status: status ?? "active",
      currentAct: currentAct ?? 0,
      currentSubAct: currentSubAct ?? 0,
      monsters: [],
      fogRevealedCells: [],
      players: [],
      log: ["La session commence..."],
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, code }, { status: 201 });
  } catch (e) {
    console.error("Erreur POST sessions:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET : Récupérer une session par code + sa campagne
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "code requis" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("dnd-vault");

    const session = await db.collection("sessions").findOne({ code });

    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    const campaign = await db.collection("campaigns").findOne({
      _id: session.campaignId,
    });

    return NextResponse.json({ session, campaign });
  } catch (e) {
    console.error("Erreur GET sessions:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT : Mettre à jour currentAct / currentSubAct (MJ uniquement)
export async function PUT(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const {
      code,
      currentAct,
      currentSubAct,
      monsters,
      fogRevealedCells,
      players,
      log,
    } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "code requis" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("dnd-vault");

    // Vérifie que l'appelant est bien le MJ de cette session
    const session = await db.collection("sessions").findOne({ code });

    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    if (session.creatorEmail !== authSession.user.email) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }

    const updateFields: Record<string, unknown> = {};
    if (currentAct !== undefined) updateFields.currentAct = currentAct;
    if (currentSubAct !== undefined) updateFields.currentSubAct = currentSubAct;
    if (monsters !== undefined) updateFields.monsters = monsters;
    if (fogRevealedCells !== undefined) updateFields.fogRevealedCells = fogRevealedCells;
    if (players !== undefined) updateFields.players = players;
    if (log !== undefined) updateFields.log = log;

    await db
      .collection("sessions")
      .updateOne({ code }, { $set: updateFields });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erreur PUT sessions:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
