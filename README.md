# Attestr: Notaries on Nostr

**Attestr** is an attestations marketplace for Nostr — a platform that enables anyone to become a "pleb oracle" and participate in decentralized verification of events, identities, and claims.

Traditional credentialism relies on centralized authorities to issue and verify credentials. Attestr inverts this power structure by enabling first-person assertions that are then attested to by trusted sovereign individuals or specialized organizations. Users weight attestations based on the attestor's verification specialization and reputation, creating kind-specific webs of trust across the Nostr ecosystem.

## Deploying

Run this from the project root:

```bash
npm run deploy
```

The deploy script will:

- build the app
- rsync `dist/` to `vps:/var/www/attestr/`
- verify `https://attestr.xyz` returns HTTP `200`

Optional overrides:

```bash
VPS_ALIAS=vps REMOTE_PATH=/var/www/attestr SITE_URL=https://attestr.xyz npm run deploy
```
