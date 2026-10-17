// ResolveLink synthetic demonstration seed
// Run in Neo4j Browser or Aura Query after creating a database.

MERGE (area:Area {id: 'area-sector-2', name: 'Sector 2'})
MERGE (location:Location {id: 'loc-f27', name: 'Road segment F-27, Sector 2', city: 'Demo City'})-[:IN_AREA]->(area)
MERGE (issue:Issue {id: 'issue-pothole', name: 'Pothole', category: 'Road safety'})
MERGE (department:Department {id: 'dept-roads', name: 'Roads & Mobility Department'})
MERGE (area)-[:OWNED_BY]->(department)
MERGE (contractor:Contractor {id: 'contractor-urbanworks', name: 'UrbanWorks Infrastructure'})
MERGE (incident:SafetyIncident {id: 'incident-018', type: 'Rider fall', occurredAt: date('2026-10-15')})

MERGE (c1:Complaint {id: 'CMP-401', status: 'CLOSED', reportedAt: date('2026-09-29'), summary: 'Deep pothole near bus stop'})
MERGE (c2:Complaint {id: 'CMP-407', status: 'RE_REPORTED', reportedAt: date('2026-10-03'), summary: 'Pothole reopened after closure'})
MERGE (c3:Complaint {id: 'CMP-416', status: 'RE_REPORTED', reportedAt: date('2026-10-08'), summary: 'Unsafe road surface for two-wheelers'})
MERGE (r1:RepairAttempt {id: 'REP-91', status: 'CLOSED', closedAt: date('2026-10-01'), closureType: 'Temporary patch'})
MERGE (r2:RepairAttempt {id: 'REP-103', status: 'CLOSED', closedAt: date('2026-10-06'), closureType: 'Temporary patch'})

FOREACH (complaint IN [c1, c2, c3] | MERGE (complaint)-[:ABOUT]->(issue) MERGE (complaint)-[:LOCATED_AT]->(location))
MERGE (c1)-[:HAS_REPAIR]->(r1)-[:PERFORMED_BY]->(contractor)
MERGE (c2)-[:REPORTED_AFTER]->(r1)
MERGE (c2)-[:HAS_REPAIR]->(r2)-[:PERFORMED_BY]->(contractor)
MERGE (c3)-[:REPORTED_AFTER]->(r2)
MERGE (c3)-[:HAS_INCIDENT]->(incident)
MERGE (c1)-[:RELATED_TO]->(c2)
MERGE (c2)-[:RELATED_TO]->(c3);

// Fake closure / recurrence query: every result must have a later report linked to that exact closed repair.
MATCH (original:Complaint)-[:HAS_REPAIR]->(repair:RepairAttempt {status: 'CLOSED'})
      -[:PERFORMED_BY]->(contractor:Contractor)
MATCH (repeat:Complaint)-[:REPORTED_AFTER]->(repair)
WHERE repeat.reportedAt > repair.closedAt
RETURN contractor.name AS contractor,
       count(DISTINCT repair) AS repeatClosures,
       collect(DISTINCT repeat.id) AS reReportedComplaintIds
ORDER BY repeatClosures DESC;
