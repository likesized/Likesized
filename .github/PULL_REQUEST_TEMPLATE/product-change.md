# Product Change

Change lane: Product Change
Product truth changed: Yes
Stale canon reconciliation: No
Governance change: No
Owner authorization: Confirmed

## Owner-authorized change
State the exact new Product truth or canonical architecture the owner authorized.

## Scope
Define the complete frozen implementation scope. Unrelated cleanup/redesign is out of scope.

## Canonical owners affected
List the Product contracts, shared systems, database contracts or governance boundaries affected by this decision.

## Files changed
List each changed file and why it is necessary.

## Canonical reconciliation
Identify affected Product Spec, stable contracts, Master state, schema contract and safeguards. Remove stale competing current-truth statements rather than preserving both answers.

## Governance change
Set `Governance change: Yes` above only when protected governance/constitution files are intentionally changing under owner authorization. Explain the reason and how the controlling safeguards remain harder to modify than normal Product code.

## Database / privacy
State migrations, RLS/policy/function, auth, privacy or data-model effects. If none, say none.

## Verification
List fast/relevant verification during implementation and the complete final verification result for the exact merge candidate.

## Deployment
State whether this PR is not deployed, preview-only, or separately owner-authorized for production after final verification.
