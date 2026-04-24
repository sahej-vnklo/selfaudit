# SelfAudit — Does your business actually need AI?

A free, AI-powered business audit tool. Built by Vnklo.

---

## What it does

1. User lands → starts free audit (no signup)
2. Provides name, email, phone (optional), context
3. Claude-powered neutral audit conversation (6–10 questions)
4. On-screen report: honest findings, non-AI fixes, AI opportunities
5. "Share with Vnklo" button → sends full report to sales@vnklo.com via Resend

---

## Deploy in 15 minutes

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env` file in the root:

```
VITE_CLAUDE_API_KEY=sk-ant-YOUR_KEY_HERE
VITE_RESEND_API_KEY=re_YOUR_KEY_HERE
```

**Get your Claude API key:** https://console.anthropic.com  
**Get your Resend API key:** https://resend.com (free tier: 3,000 emails/month)

### 3. Configure Resend

In your Resend dashboard:
- Add and verify your sending domain (selfaudit.co or vnklo.com)
- Update the `from` field in `src/lib/audit.js` if needed:
  ```
  from: 'SelfAudit <audit@selfaudit.co>'
  ```
  Change to a verified domain you own, e.g. `audit@vnklo.com`

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add your env vars in the Vercel dashboard under Project → Settings → Environment Variables.

### 6. Deploy to Netlify (alternative)

```bash
npm run build
# Drag the `dist/` folder to netlify.com/drop
```

Add env vars in Netlify dashboard under Site → Environment Variables.

### 7. Point your domain

Buy `selfaudit.co` (or similar) on Namecheap/GoDaddy.  
In your registrar's DNS settings, add a CNAME record pointing to your Vercel/Netlify deployment URL.

---

## Project structure

```
src/
  App.jsx              — Screen router
  components/
    Landing.jsx        — Landing page
    Onboarding.jsx     — Name/email/phone/context form
    AuditChat.jsx      — Chat interface
    Report.jsx         — Report display + share CTA
    ConfigScreen.jsx   — Dev-only API key setup (remove in prod)
  lib/
    audit.js           — Claude API, report generation, Resend email
  index.css            — Global styles + CSS variables
```

---

## Customization

**Change report destination email:**  
In `src/lib/audit.js`, update:
```js
to: ['sales@vnklo.com'],
```

**Change the from address:**  
Same file:
```js
from: 'SelfAudit <audit@selfaudit.co>',
```

**Adjust audit depth:**  
In `src/lib/audit.js`, modify the `SYSTEM_PROMPT` — specifically the exchange count trigger for `[READY_FOR_REPORT]`.

---

## Notes

- Report is displayed on-screen only. No PDF generation, no download.
- User cannot take the report to a competitor — it lives in the browser session.
- All AI processing happens client-side via Anthropic API.
- Email is sent server-side via Resend API (secure, no key exposed in frontend — move RESEND key to a serverless function for production hardening).

---

Built by [Vnklo](https://vnklo.com)
