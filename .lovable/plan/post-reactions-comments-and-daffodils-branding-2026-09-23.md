# Post reactions, comments, and Daffodils branding

## Build
- Add public reaction counts beneath each article with four clear choices; remember a reader’s selection on their device and let them change it.
- Add a public comment form for name and comment, followed by the newest approved comments for that article.
- Add database tables for reactions and comments, including public read/write permissions, row-level rules, post cleanup, and basic length validation.
- Add the new interactions to the article data flow so counts and comments refresh immediately after submission.
- Make cover images display within stable, responsive frames without stretching, including the article page and upload preview.
- Create a simple Daffodils flower mark beside the name in the header and footer, then add restrained yellow-and-green brand accents to page backgrounds.
- Preserve the existing blog, admin posting flow, typography, and cream/gold visual direction.

## Technical details
- Reactions will use an anonymous browser identifier stored locally, with one reaction per reader per article.
- Comments will store a display name and text only; no account is required.
- Database policies will expose only the minimum public operations needed by these two features.
- Validate the article flow on desktop and mobile: image framing, reaction switching, comment submission, and refreshed totals.
