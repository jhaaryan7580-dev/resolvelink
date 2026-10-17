# ResolveLink — Build Outcomes

- [ ] **Graph-powered intake and recurring-failure story**
  - A visitor can submit a natural-language civic/service issue report, including a vague follow-up.
  - The app extracts issue type, location, urgency cues, time context, and safety risk into visible structured fields.
  - The prototype uses transparent synthetic demo data, with one planted story: the same road stretch was closed twice by the same contractor and reported again.

- [ ] **Meaningful Neo4j graph layer**
  - The graph model explicitly relates complaints, locations, issue types, departments, contractors, repair attempts, and safety incidents.
  - A Cypher-oriented repository boundary and readable Cypher queries show how live Aura data is seeded and retrieved rather than treating Neo4j as decorative storage.
  - The demo works with synthetic fallback data when Aura credentials are absent and is ready to use `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` when supplied.

- [ ] **Explainable resolution intelligence**
  - A submitted report retrieves prior related reports, repair history, safety incidents, responsible parties, and grouped fake-closure evidence.
  - The result presents a named priority score, supporting evidence, recommended next action, and a graph-context response for a vague follow-up.
  - A toggle compares the generic answer without graph context against the answer grounded in the retrieved subgraph.

- [ ] **Focused visual demo and delivery**
  - A clean, responsive dashboard makes the connected graph and highlighted retrieval path immediately understandable in a three-minute presentation.
  - The project includes an accurate README, Neo4j seed Cypher, and graph model documentation for GitHub and hackathon submission.
  - The prototype is type-checked, built, previewed, committed, and pushed to the user’s GitHub under their account.
