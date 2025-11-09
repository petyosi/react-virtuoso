# OIDC publishing

Set up OpenID Connect (OIDC) for automated npm publishing from CI without long-lived tokens. This is more secure than storing NPM_TOKEN in GitHub secrets. Configure GitHub Actions to use OIDC provider for authenticating to npm. Test with a dry run to ensure publish workflow works correctly with changesets.

## Tasks

- [ ] Configure npm OIDC provider
- [ ] Update GitHub Actions workflow
- [ ] Test publish flow in dry-run mode
