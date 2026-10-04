# Braces depth guard

A guard-only nesting-depth backport of MIT-licensed braces 3.0.3.

Runtime code starts from the published upstream 3.0.3 release and applies only
the depth guards from https://github.com/micromatch/braces/pull/72 at commit
`d0d575e55e74a4e0218e5248fafb79efc3e54ebb`, plus the pn.2 fractional-limit and
parent-cycle fixes and the pn.3 clamp of negative `maxDepth` values to 0 (both
described below). Original stringify parent behavior is retained. Upstream authorship and the original MIT license are preserved.

The change bounds nesting and recursive AST traversal to 100 levels. Inputs
above that bound are rejected: string parsing throws SyntaxError, while
direct AST traversal guards throw RangeError. It does not limit expansion cardinality,
AST width or arbitrary malformed AST behavior. This is a maintained derivative,
not an upstream release.

Original advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. Renaming
the package does not establish advisory remediation or security acceptance.
Consumers must review the patch, artifact, provenance and compatibility.

Version 3.0.3-pn.0 is a bootstrap publication and does not claim GitHub OIDC
provenance. Version 3.0.3-pn.1 was published from the separately
authorized GitHub-hosted workflow with provenance, and 3.0.3-pn.2 followed
from the same workflow. The proposed 3.0.3-pn.3 release uses that same package
and workflow; publication is not yet complete. No package installs itself.

Run `npm ci --ignore-scripts` followed by `npm test` to execute the upstream
release suite and depth-guard regressions. Package tarballs contain only runtime
code, license, README and package metadata.

## 3.0.3-pn.2 followups

Published 3.0.3-pn.1 remains available for reproducible review. It admits depth 2
when a caller sets `maxDepth: 1.5`, and expansion of a caller-supplied or mutated
paren AST can loop when its parent chain is cyclic. The default integer limit
of 100 still holds; these findings do not establish a bypass of that default.

The pn.2 changes check the next parsing level before admission and reject
cycles in the two upward parent walks used by expansion. They follow the
public cases in https://github.com/FSDevelop/braces/pull/1 and
https://github.com/FSDevelop/braces/pull/3. Regression tests cover fractional
brace/paren limits, self-parent and two-node cycles, and ordinary parsed parens.
The original MIT license and attribution are retained.

These changes do not bound expansion cardinality, AST width, acyclic parent
chain length, or exotic object getters. No direct use of fractional limits or
caller-supplied ASTs was found in a bounded inspection of PinchNode application
code; that inspection is not proof that every transitive path is unreachable.
Neither this package name nor successful tests establish advisory clearance,
independent acceptance, or production readiness. Consumers need fresh review
of the exact published artifact and provenance before adoption.

## Proposed 3.0.3-pn.3 followup

Published 3.0.3-pn.2 accepts a negative finite `maxDepth`. Because parse,
compile, stringify and expand use `Math.min(100, maxDepth)`, a negative value
becomes the limit, so the walkers throw RangeError at depth 0 even for an AST
with no braces, and parse refuses every brace or paren.

pn.3 resolves `maxDepth` in one place (`resolveMaxDepth` in `lib/utils.js`) and
clamps negative finite values to 0. Clamping was chosen over rejecting so that
the option can only lower the limit, never raise it, and so that callers that
compute a limit get the strictest valid behavior instead of a new error type.
With a limit of 0, the root is walkable, plain text passes, and the first nested
brace or paren is refused. Fractional limits are still compared without
rounding. Non-finite values (`undefined`, `NaN`, `Infinity`, `-Infinity`) and
non-numbers still fall back to the default of 100, and larger values are still
capped at 100. Regression tests in `test/braces.max-depth.js` cover parse, compile, stringify,
expand and the top-level `braces`, `braces.parse`, `braces.compile`,
`braces.stringify` and `braces.expand` APIs. For each one they check that
negative values, -0 and 0 act as depth 0, and that depth 101 is still refused with "exceeds max depth (100)" for
`Infinity`, `NaN`, `-Infinity`, 1000, 1e9, the strings '1000', '1' and '-5',
`null`, `true`, an object whose `valueOf` returns 1000, and a BigInt. Parse
checks use 101 nested braces and 101 nested parens. Walker checks use a
hand-built tree 102 levels deep. The AST walkers are also checked for unrounded
fractional limits; parse's fractional limits are covered in `test/braces.parse.js`.

The same limits apply as for pn.2. This change doesn't establish advisory
clearance, independent acceptance or production readiness, and consumers need a
fresh review of the exact published artifact and provenance before adopting it.
