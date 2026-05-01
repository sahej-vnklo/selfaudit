<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into selfaudit. This is a React/Vite single-page application. PostHog was initialized in `src/main.jsx` using `posthog-js` and wrapped with `PostHogProvider` from `@posthog/react`. All components access PostHog via the `usePostHog()` hook. User identification is performed at login and signup, linking session events to known users. Exception capture was added to all major error boundaries.

| Event | Description | File |
|---|---|---|
| `audit_started` | User clicks "Start free audit" or "Run my audit" CTA on the Landing page | `src/components/Landing.jsx` |
| `signup_plan_selected` | User clicks a pricing plan CTA on the Landing page (navigates to signup with plan pre-selected) | `src/components/Landing.jsx` |
| `onboarding_submitted` | Anonymous user submits the pre-audit onboarding form (name, email, phone) | `src/components/Onboarding.jsx` |
| `signup_submitted` | User submits the signup form (plan selected, card entered) | `src/components/auth/Signup.jsx` |
| `signup_completed` | Signup succeeded — Supabase user created, profile inserted, Stripe subscription started | `src/components/auth/Signup.jsx` |
| `login_submitted` | User submits the login form | `src/components/auth/Login.jsx` |
| `login_completed` | User successfully logged in | `src/components/auth/Login.jsx` |
| `account_onboarding_industry_selected` | User selects their industry during post-signup onboarding (step 1) | `src/components/AccountOnboarding.jsx` |
| `account_onboarding_completed` | User saves context and completes account onboarding (step 3) | `src/components/AccountOnboarding.jsx` |
| `audit_message_sent` | User sends a message in the AuditChat conversation | `src/components/AuditChat.jsx` |
| `audit_report_ready` | Audit conversation completes and transitions to report generation | `src/components/AuditChat.jsx` |
| `upgrade_panel_shown` | User hits a scope limit and the upgrade panel is displayed | `src/components/AuditChat.jsx` |
| `upgrade_clicked` | User clicks the upgrade CTA inside the scope-limit upgrade panel | `src/components/AuditChat.jsx` |
| `report_generated` | Audit report is successfully generated and displayed | `src/components/Report.jsx` |
| `report_shared` | User clicks "Share with Vnklo" to send their report via email | `src/components/Report.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/405414/dashboard/1532442
- **Audit-to-Signup Conversion Funnel**: https://us.posthog.com/project/405414/insights/b7vbyUdX
- **Signups by Plan**: https://us.posthog.com/project/405414/insights/ZUquHJSw
- **Audit Completion Funnel**: https://us.posthog.com/project/405414/insights/nOUVOSIo
- **Upgrade Intent vs Conversion**: https://us.posthog.com/project/405414/insights/hdjwzCxs
- **Report Share Rate**: https://us.posthog.com/project/405414/insights/ewVJj9jz

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
