# Solution Design: Support Ticket Similarity Assistant

## Problem

Support agents need to find prior tickets that describe the same underlying issue as a new request, even when customers use different words. Relevant past resolutions can shorten investigation time and help the team give consistent answers. The solution should make useful ticket history easy to find while leaving the decision to apply a fix with the agent.

## Assumptions

- The ticket subject and description contain enough information to identify the issue. Both are therefore embedded for historical and new tickets using the same text format.
- Resolved tickets with resolution notes are the most actionable historical matches. Open tickets may be useful context but should not be proposed as completed fixes.
- Similarity is a ranking aid, not proof that two incidents share a cause. An agent must review a suggested resolution before applying it.
- A score above `0.75` is an initial heuristic for enabling the one-click “use this resolution” action. It has not been calibrated against labeled Solari tickets; lower-confidence or absent matches should allow manual resolution instead.
- The provided 40 synthetic historical tickets are sufficient for a demonstrable v1, not a representative production corpus. The stated 150 new tickets per day is a growth and validation requirement, not a performance result established by this prototype.
- For this local demonstration, a single API process, local SQLite file, and a locally run embedding model are acceptable. Production deployment would require operational, privacy, access-control, and scaling requirements to be agreed with Solari.

## Approach and architecture

```text
Agent
  |
  v
React + Vite application
  |  create ticket / list / detail / similarity / resolution
  v
Express API (Node.js)
  |                 \
  |                  \ subject + description
  v                   v
SQLite             Transformers.js
ticket metadata     all-MiniLM-L6-v2 embeddings
and vector blobs          |
                          v
                 cosine similarity ranking
                          |
                          v
                ranked historical tickets
```

The API seeds an empty SQLite database from `semantic-search-api/src/data/tickets.json`. During seeding, it embeds each ticket's subject and description with `Xenova/all-MiniLM-L6-v2` through Transformers.js. The normalized vectors are stored as SQLite blobs and loaded into an in-memory index when the API starts.

When an agent opens a ticket and requests similar history, the API embeds the ticket text in the same way, computes cosine similarity against the in-memory index, and returns ranked ticket metadata, scores, and simple score labels. The frontend presents resolved matches with their historical resolution notes. For a resolved match scoring above `0.75`, the agent can copy its resolution notes to the current ticket and mark it resolved. If no displayed resolved match reaches that threshold, the agent can write resolution notes manually. Both paths persist through the ticket-update endpoint.

New tickets are submitted through the React form. The API assigns an ID and creation date, defaults the status to open, generates and stores the embedding, and updates its in-memory index so the ticket is immediately searchable. The implementation and local startup steps are documented in [README.md](./README.md).

## Trade-offs

- **Semantic embeddings over keyword overlap:** Embeddings can retrieve paraphrases and related descriptions that share few literal terms, matching the customer's “similar issue” need. The cost is model download/startup time, inference latency, and a score that is harder to interpret than exact keyword matches. Keyword or category signals could be added as complementary ranking features.
- **Local model inference over a hosted AI service:** Running the embedding model in the API avoids a per-request external inference dependency and sends no ticket text to a hosted model provider. It increases local CPU/memory requirements and makes startup dependent on model availability. Ticket privacy and deployment constraints should be confirmed before production.
- **SQLite and an in-memory vector scan over a vector database:** This keeps the v1 small and easy to run with the supplied dataset. Each search scans the current index, which is reasonable to demonstrate on tens of tickets but has no measured latency or scale guarantee. At larger history sizes, benchmark first, then consider approximate nearest-neighbor indexing and a managed database if justified.
- **Agent-confirmed resolutions over automatic closure:** A high score enables a convenient action but does not close a ticket without a deliberate click. The `0.75` cutoff is provisional and should be evaluated against agent judgments to measure false matches and missed matches.
- **Simple ticket workflow over a complete help-desk system:** The prototype demonstrates create, retrieve, similarity search, and resolution updates. It intentionally omits authentication, roles, assignment, comments, notifications, audit history, and service-level workflows.

## Next steps

With more time, I would validate retrieval quality with a labeled set of real, privacy-approved historical tickets. I would measure recall at `k`, precision of proposed resolutions, agent acceptance, and end-to-end latency, then calibrate the score threshold and evaluate resolved-only retrieval. I would also add automated API and UI tests for empty history, weak matches, duplicate/self matches, failed persistence, and concurrent updates.

Before production, I would establish privacy/retention and access-control requirements, move configuration (API URL, allowed origins, model choice) out of source, add structured logs and monitoring, and test realistic data volumes and concurrency. Depending on those measurements, I would consider incremental embedding updates, pagination, a persistent vector index, background ingestion, and deployment of inference as a separate scalable service. The appropriate investment depends on ticket volume, latency objectives, and whether ticket data may leave Solari's environment.
