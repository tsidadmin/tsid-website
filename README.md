# tsid.digital

Static site for TSiD, hosted on Vercel.

- `index.html`, `css/`, `js/`, `assets/` — the main site (moved from Hostinger)
- `pavilion/` — the interactive 3D pavilion (three.js, served locally from `pavilion/vendor/`)
- `api/contact.js` — contact form handler (replaces `contact.php`), sends via Resend
- `vercel.json` — clean URLs, caching and security headers (replaces `.htaccess`)

## Contact form setup
In Vercel → Project → Settings → Environment Variables, add:
- `RESEND_API_KEY` — from resend.com (verify the tsid.digital domain there)
- `CONTACT_TO` — optional, defaults to hello@tsid.digital
- `CONTACT_FROM` — optional, defaults to `TSiD Website <no-reply@tsid.digital>`

Until the key is set, the form falls back to email and WhatsApp links.

## Editing
Push to `main` and Vercel redeploys automatically.
