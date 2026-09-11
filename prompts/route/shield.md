# Route — Shield

> Load **only** when the cascade is at the shield step (precedes level 1).

### `shield` block (precedes level 1)

Before level 1, consult the state's `shield` block. A fragment whose origin path matches an entry's `path` (+ section `selector`, when declared) is marked `regime: keep` with `decidedBy: state` — declared shielding beats every other level, and shielded content never goes through synthesis. Absence of the block = empty list: nothing is shielded and all content is reabsorbed (D9).
