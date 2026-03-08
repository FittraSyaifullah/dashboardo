<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/73c31bee-1fef-4b28-9705-42f8f10df535

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Hackathon MVP Ingestion API (Vercel-friendly)

This project now includes a lightweight serverless endpoint at:

- `GET /api/donators` -> returns `{ ok, currentDonators, incomingDonators }`
- `POST /api/donators` -> accepts dashboard actions and external ingestion

Optional env var:

- `MVP_API_KEY` (if set, all `POST` requests must include `x-api-key`)
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` (recommended for stable shared state on Vercel)

### Ingest from your other app

Send this payload to `POST /api/donators`:

```json
{
  "type": "ingest",
  "user": {
    "name": "Jane Doe",
    "tier": "Individual",
    "discount": false,
    "status": "Pending Giro"
  }
}
```

You can also pass `id`, `submittedDate`, `membershipLengthMonths`, `membershipDateEnd`, and `householdMembers`.

### Directly add approved/current user

If the user should skip "incoming" and go straight to active:

```json
{
  "type": "approved",
  "user": {
    "id": "external-user-2001",
    "name": "Already Approved",
    "tier": "Individual",
    "discount": false,
    "monthlyAmount": 50
  }
}
```

`"type": "ingestApproved"` is also supported as an alias.

### Dashboard actions

`POST /api/donators` with:

- `{ "type": "approve", "id": "..." }`
- `{ "type": "reject", "id": "..." }`
- `{ "type": "deactivate", "id": "..." }`
- `{ "type": "reactivate", "id": "..." }`

Notes for MVP scope:

- With Vercel KV configured, state is shared/persistent across serverless instances.
- Without KV vars, route falls back to in-memory state (can appear inconsistent on Vercel).
