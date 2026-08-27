# LikeSized change

Choose the correct lane before implementation. Ordinary regressions use Repair. Intentional Product/canonical-architecture changes use Product Change.

Change lane: Repair
Product truth changed: No
Stale canon reconciliation: No
Governance change: No
Owner authorization: Not applicable

## Scope
State the exact frozen owner-authorized repair/change.

## Canonical owner
Identify the existing canonical implementation or Product contract that owns this behavior.

## Files changed
List each changed file and why it is necessary.

## Verification
List the relevant checks and actual behavior verified. The exact final candidate still requires the complete merge verification gate.

## Product truth
For Repair, confirm no Product truth changed. For Product Change, change the declarations above to `Product Change`, `Yes`, and `Owner authorization: Confirmed`, then reconcile the affected canonical Product/contracts/schema/safeguards.

## Stale canon reconciliation
Use `Stale canon reconciliation: Yes` only when a pre-existing test or Product Spec assertion is demonstrably stale against already-established owner-approved canon. Identify the exact stale assertion and the canonical evidence.
