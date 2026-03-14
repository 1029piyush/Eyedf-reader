# Deploy EyeDF for Free (Render)

1. Push your latest code to GitHub.
2. Go to https://render.com and sign in.
3. Click `New +` -> `Blueprint`.
4. Select repository: `1029piyush/pdf-ai-reader`.
5. Render will detect `render.yaml` automatically.
6. In Environment Variables, set:
   - `GROQ_API_KEY` = your Groq API key
7. Click `Apply` / `Create`.
8. Wait for build and open the generated Render URL.

Notes:
- Free Render services can sleep when idle.
- `uploads/` storage on free instances is ephemeral (may reset on redeploy/restart).
