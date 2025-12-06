import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 px-4 py-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs text-slate-400">Guide</p>
          <h1 className="text-2xl font-semibold text-[#D4AF37]">
            Comment fonctionne Connect-ci ?
          </h1>
          <p className="text-xs text-slate-300">
            Voici comment utiliser l&apos;application, que vous soyez client ou prestataire.
          </p>
        </header>

        {/* For customers */}
        <section className="bg-[#11131A] border border-slate-700 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#D4AF37]">
            Pour les clients
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-200">
            <li>
              <span className="font-semibold">Créez un compte</span> en vous inscrivant avec votre e-mail.
            </li>
            <li>
              <span className="font-semibold">Postez une demande</span> :
              indiquez le service souhaité, le lieu, l&apos;heure et votre budget.
            </li>
            <li>
              <span className="font-semibold">Recevez des candidatures</span> de prestataires intéressés et discutez avec eux via le chat.
            </li>
            <li>
              <span className="font-semibold">Choisissez votre prestataire</span> selon son profil, ses notes et son message.
            </li>
            <li>
              <span className="font-semibold">Une fois le service terminé</span>, marquez la demande comme complétée et laissez une note.
            </li>
          </ol>
        </section>

        {/* For providers */}
        <section className="bg-[#11131A] border border-slate-700 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#D4AF37]">
            Pour les prestataires
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-200">
            <li>
              <span className="font-semibold">Créez votre profil prestataire</span> en choisissant le rôle
              &quot;livreur / prestataire&quot; lors de l&apos;inscription.
            </li>
            <li>
              <span className="font-semibold">Consultez les demandes disponibles</span> autour de vous dans le tableau de bord prestataire.
            </li>
            <li>
              <span className="font-semibold">Postulez</span> en envoyant un message et un prix au client.
            </li>
            <li>
              <span className="font-semibold">Si le client vous accepte</span>, utilisez le chat pour organiser le service (lieu, heure, détails).
            </li>
            <li>
              <span className="font-semibold">Réalisez le service</span>, puis attendez que le client marque la demande
              comme complétée et laisse une note.
            </li>
          </ol>
        </section>

        {/* Note about Connect-ci */}
        <section className="bg-[#0b0d13] border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-[#D4AF37]">
            Ce que fait Connect-ci
          </h3>
          <p className="text-xs text-slate-300">
            Connect-ci ne réalise pas directement les services : la plateforme
            met en relation des personnes qui ont besoin d&apos;aide et des
            prestataires disponibles. Les modalités de paiement et de réalisation
            se font directement entre vous.
          </p>
        </section>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[#D4AF37] underline hover:text-[#f1c94a]"
          >
            ← Retour à la page d&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
