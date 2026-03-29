# DnD Vault — Instructions pour Claude

## Git

- Faire un git commit après chaque modification fonctionnelle
- Format conventionnel : type(scope): description courte
- Types : feat, fix, refactor, chore, docs
- Committer uniquement si ça compile
- **Ne pas demander de confirmation avant de committer — committer automatiquement**

## Vision du projet

Plateforme VTT (Virtual Tabletop) open source, immersive et gratuite, pensée comme alternative légère à Roll20/Foundry. Objectif : rendre une session D&D 5e à distance aussi immersive qu'une partie physique, voire plus.

## Ambitions fonctionnelles (roadmap vision)

- Importation de cartes 3D custom (format GLTF/OBJ ou similaire)
- Figurines 3D pour les personnages et monstres (Three.js ou Babylon.js à évaluer)
- Vue première personne depuis le token du joueur pour immersion totale
- Quadrillage configurable par carte (taille, type hex/carré, snap)
- Effets visuels des sorts D&D 5e (particules, animations, AOE)
- Importation complète du SRD 5e : sorts, classes, races, capacités
- Paramétrage approfondi à la création de partie pour une flexibilité maximale
- Architecture open source, auto-hébergeable

## Stack technique actuelle

- Next.js 15+ (App Router), TypeScript strict
- Tailwind CSS, thème Slate-950 + accents Amber-500
- MongoDB (pilote natif), NextAuth.js (Discord uniquement)
- Lucide React (icônes), Framer Motion (animations prévues)
- API Routes Next.js (/api/...)

## État d'avancement

✅ Fait : Auth Discord, Bestiaire SRD + custom, Éditeur de campagne (Actes/Sous-actes), Config de map (grille, upload image), Navbar, Hub session
🔄 En cours : Session Live (code unique, vue MJ/Joueur), migration localStorage → MongoDB
❌ À faire : WebSockets (Pusher ou Socket.io), Combat Tracker (initiative, tour par tour), Inventaire/Sorts détaillés, 3D

## Architecture clé

- lib/auth.ts → config NextAuth (authOptions toujours requis dans getServerSession)
- app/api/campaigns/route.ts → CRUD campagnes, toujours filtré par creatorEmail
- app/play/[code]/page.tsx → moteur session live, différenciation MJ/Joueur via searchParams
- app/campaigns/create/page.tsx → formulaire de construction de campagne
- app/components/BattleGrid.tsx → rendu carte de combat (ne pas modifier sans vérifier les offsets)

## Conventions de code

- TypeScript strict partout
- "use client" uniquement si interaction navigateur indispensable
- Toujours filtrer les requêtes MongoDB par creatorEmail
- Distinguer \_id (ObjectId MongoDB) et id (string) dans les échanges front/back
- Composants fonctionnels, pas de classes React

## Problèmes connus

- Délai d'indexation MongoDB → router.refresh() comme palliatif
- \_id vs id : vigilance systématique dans les API routes

## Priorités immédiates

1. Synchronisation scène active : MJ change de scène → tous les joueurs changent de vue
2. Édition des PV joueurs/monstres en live depuis la sidebar MJ
3. Remplacement du polling API par WebSockets (évaluer Pusher vs Socket.io)
