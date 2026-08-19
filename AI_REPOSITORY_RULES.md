# LikeSized AI Repository Rules

This file is the canonical repository policy for every AI agent and human contributor working on LikeSized.

## Canonical Repository Rule — No Patches

LikeSized must remain a clean, canonical repository at all times.

1. **Never create patch files, hotfix files, temporary repair files, duplicate replacement files, or version-suffixed copies as a way to change the product.**
2. **Every approved change must be applied directly to the canonical source file(s) that own that behavior.**
3. Do not leave behind files such as `*-fixed`, `*-patched`, `*-new`, `*-v2`, `*-backup`, `*-temp`, `*-copy`, or similar substitutes when the original file should simply be updated.
4. Do not maintain parallel implementations of the same feature to preserve an older version. Git history is the history. The working tree should represent the current canonical product only.
5. When replacing an implementation, update the canonical file and remove obsolete code/files in the same change when safe to do so.
6. Database changes must be reflected in the canonical schema/migration structure used by the project; do not create ad hoc SQL patch dumps as the long-term source of truth.
7. Documentation and project records must describe the current canonical state, not require a future AI to reconstruct the product from a chain of patch notes.
8. Temporary files created during local debugging must never be committed unless they are an intentional permanent part of the product.
9. Every AI agent must inspect this file before making repository changes and must preserve this rule unless the repository owner explicitly changes it.
10. If an instruction conflicts with this policy, stop and ask the repository owner rather than creating a patch workaround.

## Definition of Done

A change is not complete until the repository itself is clean and canonical: the normal source files contain the final implementation, obsolete alternatives are removed, and a new contributor can understand the current product without applying or interpreting patches.

## Source of Truth

This file is the authoritative policy. Agent-specific instruction files may repeat or point to it, but they must not weaken or override it.
