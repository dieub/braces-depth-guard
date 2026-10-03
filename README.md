# Braces depth guard

A guard-only nesting-depth backport of MIT-licensed braces 3.0.3.

Runtime code starts from the published upstream 3.0.3 release and applies only
the depth guards from https://github.com/micromatch/braces/pull/72 at commit
`d0d575e55e74a4e0218e5248fafb79efc3e54ebb`. Original stringify parent behavior
is retained. Upstream authorship and the original MIT license are preserved.

The change bounds nesting and recursive AST traversal to 100 levels. Inputs
above that bound are rejected: string parsing throws SyntaxError, while
direct AST traversal guards throw RangeError. It does not limit expansion cardinality,
AST width or malformed cyclic parent links. This is a maintained derivative,
not an upstream release.

Original advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. Renaming
the package does not establish advisory remediation or security acceptance.
Consumers must review the patch, artifact, provenance and compatibility.

Version 3.0.3-pn.0 is a bootstrap publication and does not claim GitHub OIDC
provenance. The intended 3.0.3-pn.1 release is published from the separately
authorized GitHub-hosted workflow with provenance. No package installs itself.

Run `npm ci --ignore-scripts` followed by `npm test` to execute the upstream
release suite and depth-guard regressions. Package tarballs contain only runtime
code, license, README and package metadata.
