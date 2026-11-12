# Public exposure review — November 12, 2026

**Result: public access verified; limited source review completed; privacy and licensing follow-up remains open.** This is an AI-assisted documentation/source review, not independent security certification, a penetration test, or an unrestricted-launch approval.

## Inspected scope

Reviewed application baseline `ff27c9672a32904bf621f6e0b231c3110b1f22b7` and documentation merge `bbae0ca5ef7428a5e6c6c33828ed7a9de5d3024b` ([PR #69](https://github.com/tdong1919-dev/founders-builders/pull/69)). An anonymous mirror contained 244 reachable commits across 141 refs: 69 branch refs, 72 pull-request refs, and no tags. The review scanned 1,614 unique blobs; current `main` had 336 tracked files. Counts describe that snapshot, not future changes or inaccessible/unreachable server objects.

Tools: Git 2.34.0; local Python 3.8.2 pattern scan and manual candidate review; Python 3.11.15 anonymous HTTP checks. Pattern categories covered private keys, common provider/server tokens, literal credentials, credential-bearing/signed URLs, JWTs, private Drive/invite links, risky filenames, and LFS pointers. These are bounded heuristics, not a complete commercial secret-scanner ruleset.

Manual inspection covered configuration, credential-like matches, synthetic fixtures, setup instructions, personal-contact candidates, binary/attachment inventory, and roadmap evidence. The four bundled font objects, branding image, and two versions of the brand-kit ZIP were inventoried; ZIP entries contained branding SVG/CSS/text assets. No LFS pointers were present. No root source license was present; IBM Plex's SIL OFL notice is retained.

Public metadata review covered all 69 issue/PR entries then returned, 22 issue comments, and zero inline review comments. No GitHub user-upload attachment links were identified in that inventory. The release collection was empty. Anonymous Actions APIs returned zero workflow runs and zero artifacts. Provider dashboards, private storage, deleted/unreachable Git objects, external caches/forks, and non-repository service logs were not audited.

## Findings and limits

| Area | Observation | Status / next action |
| --- | --- | --- |
| Credentials | No confirmed password, private/server key, credential-bearing private URL, or JWT was identified in the scanned reachable content. Matches were code/test fixtures, literal placeholders, or over-broad font-URL matches. | No confirmed exposed secret requiring rotation was identified by this review. This does not guarantee absence of secrets. |
| Client configuration | The browser configuration uses a publishable client key, not a server/service-role secret. Legacy submission switch remains disabled. | Public client configuration does not prove live RLS/authorization acceptance. No backend settings changed. |
| Private records and backups | No production dump, local database, private Drive/backup link, participant export, or recovery key was identified by the reviewed paths/patterns. | Do not introduce such material. This is not a review of private backend data or live attachments. |
| Historical personal contact | An owner/test personal contact appears in an older operational-document revision outside current `main`. Its value is intentionally omitted here. | **Open:** owner review of continued public history exposure. Do not silently rewrite branches/PR history; prepare a separately approved redaction/history-cleanup plan if removal is wanted. |
| Existing public Project | The correct existing Project was empty, with no archived items, description, or README at inspection. It was already public. | Reused for sanitized roadmap information; no duplicate Project or visibility change. Only public product/engineering facts belong there. |
| Documentation accuracy | PR #69 was already merged. Stale private-repository wording required correction. Earlier stacked PRs were included through #59; #63 and #68 remained open. | Corrected current guides while preserving historical records and unrelated work. Merge, test, deployment, and adoption remain distinct. |
| Licensing | No root license grants reuse of the application source. Bundled IBM Plex fonts have their own SIL OFL notice. | **Open:** owner choice of source license or explicit retained-rights policy; any broader third-party provenance/legal review remains separate. No license grant introduced. |

## Anonymous access

Fresh requests without cookies or authentication returned HTTP 200 on November 12, 2026 at 14:39 UTC for:

- [Public repository](https://github.com/tdong1919-dev/founders-builders) and its raw `main` README.
- [Existing Project #4](https://github.com/users/tdong1919-dev/projects/4), with its Founders & Builders title and no login redirect.
- [Beta homepage](https://founders-builders-ux-review.hello978822.chatgpt.site/) and [fictional tour](https://founders-builders-ux-review.hello978822.chatgpt.site/quick-tour.html).

Anonymous source/roadmap access is distinct from approved beta-account access or authorization to private collaboration records. This check establishes access at that time, not continuous uptime or a completed authenticated participant journey.

## Kept outside this task

No production code, deployment, database, signup approval, agent scope, access grant, notification activation, or hosting change was made. Collaboration emails and legacy Sheets submissions remain off. Compensation remains directly between participants; the platform processes no payments and takes no transaction cut. Web3 portability remains a future exploration, with no implemented blockchain, token, wallet, escrow, or unrestricted autonomous execution.

Private credentials, participant records/conversations, attachments, and backup material must remain outside this repository and public Project. This report deliberately publishes no personal-contact value or private evidence payload. Public visibility already existed; this review does not certify all historical exposure as cleared.
