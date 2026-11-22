<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep the scooter identity in a shared top band above the planner and map, so the brand is visible on phones without burying the map.
- Use imported asset pointers for supplied scooter photography and CSS-treated live text for the app logo, so artwork stays exact and lettering remains accessible.
- Build external navigation URLs from the completed route endpoints in a browser-safe helper; provider apps recalculate routes, so warn before handoff rather than claiming speed-limit preservation.
- Match live GPS fixes to the existing route with Turf and Valhalla maneuver shape indices; never silently reroute or imply posted-speed verification.
- Keep GPS, wake lock, and speech lifecycle in the live-navigation hook; release resources on stop, arrival, and unmount and reacquire wake lock on visibility return.
- Give header artwork explicit responsive dimensions so intrinsic image height cannot exceed the compact header.
- Keep home-screen support manifest-only with local artwork-derived icons and root head tags; no app-shell service worker because offline navigation is not supported.
