# Geographic sectors of frozen temporal groups

Base analysis `a9081db1a25b71e3`; spatial overlay `1a133add8ef86e5e`.

Geography only divides existing temporal groups into static connected portions. It does not change their memberships, refit migration clusters, or establish migration similarity from proximity. All sectors are exploratory: the base analysis accepted no robust groups after its stability screens. Singletons have no shared-pattern claim.

Original-boundary rook graph: 977 edges. Exact shared-edge display crosscheck: 977 common, 0 original-only, 0 display-only. Original geometry is authoritative.

Radius 10/20/30 km graphs connect centroid pairs within their threshold and take induced components inside each parent. Chaining can produce a component whose full diameter exceeds its threshold; every sector exports this diameter and a chaining flag. Distances are straight-line great-circle centroid distances, not routes.

Pair summaries use each unique unordered pair once. No singleton receives a perfect correlation. Undefined correlations stay missing. Raw-count and unshrunk-rate Pearson changes are separate from the saved clipped modeled-change correlations. At least eight jointly observed transitions are required for the additional correlations. Regional residuals subtract the common calendar-year regional rate change; they are descriptive sensitivity measures.

## Manual four-municipality area

Krušnohoří: Blatno–Kalek–Boleboř–Hora Svaté Kateřiny

Rook components: [['562998', '563005', '563111', '567167']]

## Global descriptive geographic association

immigration: Spearman geographic distance versus temporal dissimilarity = -0.0086, 62481 reliable unique pairs; two-sided municipality-label permutation tail 0.335 (199 repetitions, seed 20261024, +1 adjustment).
emigration: Spearman geographic distance versus temporal dissimilarity = 0.0080, 62481 reliable unique pairs; two-sided municipality-label permutation tail 0.120 (199 repetitions, seed 20261024, +1 adjustment).

The permutation moves municipality labels jointly along rows and columns, including the reliability mask. It assumes label exchangeability under no geographic association and preserves dependence among pairs; this is descriptive approximate evidence, not an iid-pair significance test.

### immigration

Mean clipped Pearson 0.121; Spearman 0.148; informative directional agreement 0.573; opposition 0.427; mean shared informative years 25.0; mean regional-residual Pearson 0.061. Full geographic diameter 9.31 km.

| Municipality pair | km | Rook | Clipped Pearson | Rate Pearson | Residual Pearson | Agreement | Shared years |
|---|---:|---|---:|---:|---:|---:|---:|
| 562998 – 563111 | 6.08 | True | 0.132 | 0.058 | 0.105 | 0.520 | 25 |
| 562998 – 563005 | 4.99 | True | 0.431 | 0.387 | 0.339 | 0.640 | 25 |
| 562998 – 567167 | 9.31 | False | 0.310 | 0.318 | 0.208 | 0.720 | 25 |
| 563111 – 563005 | 6.89 | True | 0.235 | 0.144 | 0.184 | 0.640 | 25 |
| 563111 – 567167 | 7.83 | True | -0.574 | -0.537 | -0.550 | 0.320 | 25 |
| 563005 – 567167 | 4.90 | True | 0.189 | 0.171 | 0.077 | 0.600 | 25 |

### emigration

Mean clipped Pearson 0.004; Spearman 0.033; informative directional agreement 0.453; opposition 0.547; mean shared informative years 25.0; mean regional-residual Pearson -0.017. Full geographic diameter 9.31 km.

| Municipality pair | km | Rook | Clipped Pearson | Rate Pearson | Residual Pearson | Agreement | Shared years |
|---|---:|---|---:|---:|---:|---:|---:|
| 562998 – 563111 | 6.08 | True | -0.057 | -0.057 | -0.107 | 0.240 | 25 |
| 562998 – 563005 | 4.99 | True | -0.333 | -0.333 | -0.335 | 0.400 | 25 |
| 562998 – 567167 | 9.31 | False | 0.605 | 0.605 | 0.593 | 0.840 | 25 |
| 563111 – 563005 | 6.89 | True | 0.117 | 0.117 | 0.103 | 0.440 | 25 |
| 563111 – 567167 | 7.83 | True | -0.136 | -0.136 | -0.181 | 0.400 | 25 |
| 563005 – 567167 | 4.90 | True | -0.171 | -0.171 | -0.176 | 0.400 | 25 |

## Context inventory

| Mode/configuration/level/view | Rook sectors | Radius 10 | Radius 20 | Radius 30 |
|---|---:|---:|---:|---:|
| immigration|loose|micro|robust | 0 | 0 | 0 | 0 |
| immigration|loose|micro|candidate | 332 | 313 | 244 | 198 |
| immigration|loose|macro|robust | 0 | 0 | 0 | 0 |
| immigration|loose|macro|candidate | 312 | 246 | 132 | 71 |
| immigration|balanced|micro|robust | 0 | 0 | 0 | 0 |
| immigration|balanced|micro|candidate | 332 | 313 | 244 | 198 |
| immigration|balanced|macro|robust | 0 | 0 | 0 | 0 |
| immigration|balanced|macro|candidate | 312 | 246 | 132 | 71 |
| immigration|strict|micro|robust | 0 | 0 | 0 | 0 |
| immigration|strict|micro|candidate | 248 | 239 | 199 | 177 |
| immigration|strict|macro|robust | 0 | 0 | 0 | 0 |
| immigration|strict|macro|candidate | 242 | 228 | 171 | 141 |
| emigration|loose|micro|robust | 0 | 0 | 0 | 0 |
| emigration|loose|micro|candidate | 333 | 316 | 267 | 204 |
| emigration|loose|macro|robust | 0 | 0 | 0 | 0 |
| emigration|loose|macro|candidate | 307 | 255 | 134 | 73 |
| emigration|balanced|micro|robust | 0 | 0 | 0 | 0 |
| emigration|balanced|micro|candidate | 332 | 315 | 265 | 201 |
| emigration|balanced|macro|robust | 0 | 0 | 0 | 0 |
| emigration|balanced|macro|candidate | 307 | 254 | 131 | 71 |
| emigration|strict|micro|robust | 0 | 0 | 0 | 0 |
| emigration|strict|micro|candidate | 228 | 222 | 195 | 168 |
| emigration|strict|macro|robust | 0 | 0 | 0 | 0 |
| emigration|strict|macro|candidate | 224 | 210 | 168 | 125 |
