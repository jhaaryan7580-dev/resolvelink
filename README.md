# ResolveLink

> **Reports alone do not fix places. Connections do.**

ResolveLink is a graph-powered issue intelligence prototype that turns a natural-language report into an explainable resolution recommendation. Instead of treating a pothole, water leak, safety hazard, or repeated service failure as an isolated ticket, it connects the report to prior complaints, locations, repair attempts, contractors, safety incidents, and responsible departments.

The prototype was built for the **Neo4j Graph Builder Build Sprint Bengaluru**. Its seeded demo story is deliberately transparent: a road stretch was closed twice by the same contractor, then reported again. The product detects that recurring pattern and recommends escalation for permanent repair rather than creating one more routine ticket.

## Demo flow

1. Submit a report such as: `A delivery rider slipped near a large pothole. It is still dangerous.`
2. ResolveLink extracts the issue type, location entity, urgency cues, and safety risk.
3. Neo4j retrieves the connected subgraph around the report: earlier complaints, repair history, contractor, incident, and department.
4. The UI explains the named factors in the critical-priority score, exposes the recurrence/fake-closure pattern, and recommends the next action.
5. Switch **Follow-up memory mode** from “Without graph” to “With graph” to compare a generic reply to an answer grounded in retrieved graph context.

## Why Neo4j is essential

The key question is not “is there a past ticket?” It is: **which closed repairs are attached to this location, which contractor performed them, did the problem recur after closure, and is there a linked safety incident?** That requires multi-hop relationship traversal:

```text
Complaint → Location → Prior complaints → Repair attempts → Contractor
                       ↘ Safety incident
Location → Area → Responsible department
```

This is the decision path behind ResolveLink’s recommendation. The same answer is awkward and brittle with isolated records or keyword search alone.

- [`docs/graph-model.md`](docs/graph-model.md) explains the graph model and planted story.
- [`scripts/seed-resolvelink.cypher`](scripts/seed-resolvelink.cypher) seeds an Aura/Neo4j Browser database and contains the fake-closure query.
- [`server/resolveGraph.ts`](server/resolveGraph.ts) is the Cypher-oriented graph access boundary. It uses `neo4j-driver` with Aura credentials and a clearly labeled synthetic fallback for a no-credential demo.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

### Connect Neo4j Aura

The prototype automatically uses Neo4j Aura when the following server-only environment variables are available:

```bash
NEO4J_URI=neo4j+s://<your-instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<your-password>
NEO4J_DATABASE=neo4j
```

First run `scripts/seed-resolvelink.cypher` in Aura Query or Neo4j Browser. Without these values, the prototype deliberately runs on the same synthetic seeded story and labels itself **Synthetic demo graph** rather than claiming a live connection.

## Tech stack

React, TypeScript, Express, tRPC, Neo4j JavaScript Driver, Neo4j Cypher, and a Neo4j Aura-ready repository boundary.

## Safe demo-data note

All people, complaints, locations, incidents, contractors, dates, and outcomes in this repository are synthetic. They are designed only to demonstrate a graph workflow and must not be interpreted as real civic-service claims.
