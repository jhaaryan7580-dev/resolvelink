# ResolveLink Graph Model

ResolveLink turns a reported problem into an explainable resolution decision by modelling the context that a ticket system usually splits apart.

```text
(:Reporter)-[:SUBMITTED]->(:Complaint)
(:Complaint)-[:ABOUT]->(:Issue)
(:Complaint)-[:LOCATED_AT]->(:Location)
(:Location)-[:IN_AREA]->(:Area)-[:OWNED_BY]->(:Department)
(:Complaint)-[:HAS_REPAIR]->(:RepairAttempt)-[:PERFORMED_BY]->(:Contractor)
(:LaterComplaint)-[:REPORTED_AFTER]->(:RepairAttempt)
(:Complaint)-[:HAS_INCIDENT]->(:SafetyIncident)
```

## The planted story

`Road segment F-27` received a pothole report. `UrbanWorks Infrastructure` closed a temporary repair. A later complaint is explicitly connected to that exact repair through `(:LaterComplaint)-[:REPORTED_AFTER]->(:RepairAttempt)`. The pattern repeats for a second closure, and a safety incident is linked to the same location. When a new message describes a rider slipping at the location, ResolveLink traverses that subgraph and recommends escalation to the roads department instead of a third routine inspection.

## Why a graph matters

A flat ticket list can show prior tickets, but it cannot naturally answer: _Which closed repairs are connected to this location, which contractor performed them, and did a later report occur after a specific closure?_ ResolveLink uses connected traversal and explicit temporal relationships to retrieve that evidence and explain its recommendation.
