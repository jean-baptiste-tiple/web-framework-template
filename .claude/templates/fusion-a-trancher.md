# Gabarit — Brief de décision de fusion (doublons de composants)

La règle DRY pousse à fusionner ; ce gabarit empêche de fusionner en aveugle. Pour chaque
doublon candidat, remplir un brief, décider, puis reporter la décision datée au registre
(section « Doublons & consolidation »). Une fusion dont les rendus diffèrent vraiment = bloat :
garder séparé (⛔ + raison) est une décision valide.

## <ComposantA> vs <ComposantB>

- **Où les voir** : URL(s) où chacun est rendu (préprod ou local) — vérifier VISUELLEMENT, pas
  seulement le code.
- **Divergence réelle** : en quoi les rendus diffèrent (géométrie, couleurs, comportements,
  responsive). « Le markup se ressemble » ne suffit pas.
- **Coût de la fusion** : props/variantes à ajouter au canonique, call-sites à migrer, risque de
  régression visuelle.
- **Recommandation** : fusionner dans <canonique> / garder séparés (⛔) / scinder autrement.
- **Décision (AAAA-MM-JJ)** : quoi + raison en une ligne. Reportée au registre.
