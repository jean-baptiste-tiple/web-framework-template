# Îlots SolidJS

> Starter OPT-IN : SolidJS n'est PAS installé par défaut. Installer le starter solid (.tiple/starters/solid) avant d'écrire un îlot. Convention chargée seulement si le starter est activé.

- Un îlot UNIQUEMENT si interactivité réelle (state, events, fetch client). Sinon : composant .astro statique, natif (<details>), ou <script> vanilla.
- Fichiers dans src/components/islands/ (.tsx), default export.
- Hydratation : préférer client:visible ou client:idle. client:load seulement si visible au-dessus de la ligne de flottaison et critique.
- Garder l îlot petit et isolé : passer les données en props depuis l .astro, ne pas importer de gros modules.
- Pour des primitives accessibles (dialog, menu, combobox) : Kobalte (équivalent Solid de Radix). À installer seulement au besoin.
- Vérifier après build le poids du chunk JS généré.
