// Essai gratuit : questionnaire + création du compte. Accès immédiat.
import { estEmailAdmin } from "@/lib/auth";
import { admin, clientSession } from "@/lib/supabase";

const ENTREPRISE_HISTORIQUE = "00000000-0000-0000-0000-000000000001";
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const texte = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}));

  // Champ invisible : seuls les robots le remplissent.
  if (texte(c.site)) return Response.json({ ok: true });

  const entreprise = {
    nom: texte(c.entreprise?.nom),
    secteur: texte(c.entreprise?.secteur, 60) || null,
    ville: texte(c.entreprise?.ville, 80) || null,
    communes: texte(c.entreprise?.communes, 200) || null,
    nb_livreurs: texte(c.activite?.nbLivreurs, 30) || null,
    livraisons_jour: texte(c.activite?.livraisonsJour, 30) || null,
    outil_actuel: texte(c.activite?.outilActuel, 60) || null,
    source: texte(c.activite?.source, 60) || null,
  };
  const nom = texte(c.compte?.nom);
  const email = texte(c.compte?.email, 200).toLowerCase();
  const telephone = texte(c.compte?.telephone, 30);
  const motDePasse = String(c.compte?.motDePasse ?? "");

  if (!entreprise.nom) return Response.json({ erreur: "Indiquez le nom de votre entreprise." }, { status: 400 });
  if (!nom) return Response.json({ erreur: "Indiquez votre nom." }, { status: 400 });
  if (!EMAIL_OK.test(email)) return Response.json({ erreur: "Adresse e-mail invalide." }, { status: 400 });
  if (telephone.replace(/\D/g, "").length < 8) {
    return Response.json({ erreur: "Numéro de téléphone invalide." }, { status: 400 });
  }
  if (motDePasse.length < 8) {
    return Response.json({ erreur: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const sb = admin();

  // 1. Le compte (confirmé tout de suite : pas d'e-mail de validation à attendre).
  const { data: cree, error: errCompte } = await sb.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { nom },
  });
  if (errCompte || !cree.user) {
    const deja = /already|registered|exists/i.test(errCompte?.message ?? "");
    return Response.json(
      { erreur: deja ? "Un compte existe déjà avec cet e-mail. Connectez-vous." : "Création du compte impossible." },
      { status: deja ? 409 : 500 },
    );
  }
  const userId = cree.user.id;

  try {
    // 2. L'entreprise. Le premier administrateur récupère les données d'avant le passage en SaaS.
    let entrepriseId: string | null = null;
    if (estEmailAdmin(email)) {
      const { data: hist } = await sb.from("entreprises").select("id").eq("id", ENTREPRISE_HISTORIQUE).maybeSingle();
      const { count } = await sb.from("membres").select("*", { count: "exact", head: true }).eq("entreprise_id", ENTREPRISE_HISTORIQUE);
      if (hist && !count) {
        const { error } = await sb
          .from("entreprises")
          .update({ ...entreprise, telephone, email })
          .eq("id", ENTREPRISE_HISTORIQUE);
        if (error) throw error;
        entrepriseId = ENTREPRISE_HISTORIQUE;
      }
    }
    if (!entrepriseId) {
      const { data, error } = await sb
        .from("entreprises")
        .insert({ ...entreprise, telephone, email })
        .select("id")
        .single();
      if (error) throw error;
      entrepriseId = data.id as string;
    }

    // 3. Le lien gérant ↔ entreprise.
    const { error: errMembre } = await sb
      .from("membres")
      .insert({ user_id: userId, entreprise_id: entrepriseId, nom, role: "proprietaire" });
    if (errMembre) throw errMembre;
  } catch (e) {
    // On annule le compte pour pouvoir réessayer proprement.
    await sb.auth.admin.deleteUser(userId).catch(() => {});
    console.error("Inscription :", e);
    return Response.json({ erreur: "Création de l'entreprise impossible. Réessayez." }, { status: 500 });
  }

  // 4. Connexion directe.
  const session = await clientSession();
  await session.auth.signInWithPassword({ email, password: motDePasse });
  return Response.json({ ok: true }, { status: 201 });
}
