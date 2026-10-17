import neo4j, { type Driver } from "neo4j-driver";

export type GraphNodeKind =
  | "complaint"
  | "location"
  | "area"
  | "issue"
  | "repair"
  | "contractor"
  | "incident"
  | "department";

export type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  detail: string;
  x: number;
  y: number;
  isNew?: boolean;
  isHighlighted?: boolean;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  isHighlighted?: boolean;
};

export type IntakeFields = {
  issueType: string;
  location: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  timeContext: string;
  safetyRisk: boolean;
  confidence: number;
};

type CypherView = { title: string; query: string };

export type ResolutionAnalysis = {
  graphMode: "Neo4j Aura" | "Synthetic demo graph";
  complaintId: string;
  intake: IntakeFields;
  score: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
  actionOwner: string;
  relatedReports: number;
  recurrenceDays: number;
  fakeClosure: { contractor: string; closures: number; insight: string };
  evidence: Array<{ label: string; detail: string; weight: string }>;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  cypher: { context: CypherView; fakeClosure: CypherView };
  followUp: { message: string; withoutGraph: string; withGraph: string };
};

export const CYPHER = {
  upsertComplaint: `// 1. Save the submitted issue into the connected graph
MERGE (location:Location {id: $locationId})
  ON CREATE SET location.name = $locationName
MERGE (issue:Issue {name: $issueType})
CREATE (complaint:Complaint {
  id: $complaintId, summary: $message, status: 'OPEN',
  severity: $severity, reportedAt: datetime()
})
MERGE (complaint)-[:ABOUT]->(issue)
MERGE (complaint)-[:LOCATED_AT]->(location)
RETURN complaint`,
  retrieveContext: `// 2. Retrieve the multi-hop subgraph behind the recommendation
MATCH (new:Complaint {id: $complaintId})-[:LOCATED_AT]->(location:Location)
OPTIONAL MATCH (prior:Complaint)-[:LOCATED_AT]->(location)
WHERE prior.id <> new.id
OPTIONAL MATCH (prior)-[:HAS_REPAIR]->(repair:RepairAttempt)-[:PERFORMED_BY]->(contractor:Contractor)
OPTIONAL MATCH (prior)-[:HAS_INCIDENT]->(incident:SafetyIncident)
OPTIONAL MATCH (location)-[:IN_AREA]->(:Area)-[:OWNED_BY]->(department:Department)
RETURN new.id AS complaintId, location.name AS locationName,
       count(DISTINCT prior) AS relatedReports,
       collect(DISTINCT prior.id) AS reportIds,
       count(DISTINCT repair) AS repairCount,
       collect(DISTINCT contractor.name) AS contractors,
       count(DISTINCT incident) AS incidentCount,
       coalesce(head(collect(DISTINCT department.name)), 'Unassigned') AS actionOwner`,
  fakeClosure: `// 3. Prove a repeat-after-closure pattern and group it by contractor
MATCH (original:Complaint)-[:HAS_REPAIR]->(repair:RepairAttempt {status: 'CLOSED'})
      -[:PERFORMED_BY]->(contractor:Contractor)
MATCH (repeat:Complaint)-[:REPORTED_AFTER]->(repair)
WHERE repeat.reportedAt > repair.closedAt
RETURN contractor.name AS contractor,
       count(DISTINCT repair) AS repeatClosures,
       collect(DISTINCT repeat.id) AS reReportedComplaintIds
ORDER BY repeatClosures DESC`,
  demoContext: `// Read the seed graph without creating a new complaint on page load
MATCH (location:Location {id: 'loc-f27'})
OPTIONAL MATCH (prior:Complaint)-[:LOCATED_AT]->(location)
OPTIONAL MATCH (prior)-[:HAS_REPAIR]->(repair:RepairAttempt)-[:PERFORMED_BY]->(contractor:Contractor)
OPTIONAL MATCH (prior)-[:HAS_INCIDENT]->(incident:SafetyIncident)
OPTIONAL MATCH (location)-[:IN_AREA]->(:Area)-[:OWNED_BY]->(department:Department)
RETURN 'CMP-LIVE-DEMO' AS complaintId,
       location.name AS locationName,
       count(DISTINCT prior) AS relatedReports,
       count(DISTINCT repair) AS repairCount,
       count(DISTINCT incident) AS incidentCount,
       coalesce(head(collect(DISTINCT contractor.name)), 'Unassigned contractor') AS contractor,
       coalesce(head(collect(DISTINCT department.name)), 'Unassigned') AS actionOwner`,
};

const graphNodes: GraphNode[] = [
  {
    id: "complaint-new",
    label: "New report",
    kind: "complaint",
    detail: "CMP-428 · just submitted",
    x: 84,
    y: 272,
    isNew: true,
    isHighlighted: true,
  },
  {
    id: "location-f27",
    label: "Road segment F-27",
    kind: "location",
    detail: "Sector 2 · demo city",
    x: 286,
    y: 258,
    isHighlighted: true,
  },
  {
    id: "issue-pothole",
    label: "Pothole",
    kind: "issue",
    detail: "Road safety",
    x: 286,
    y: 443,
    isHighlighted: true,
  },
  {
    id: "complaint-401",
    label: "CMP-401",
    kind: "complaint",
    detail: "Reported · 18 days ago",
    x: 500,
    y: 76,
  },
  {
    id: "complaint-407",
    label: "CMP-407",
    kind: "complaint",
    detail: "Re-reported · 14 days ago",
    x: 520,
    y: 248,
    isHighlighted: true,
  },
  {
    id: "complaint-416",
    label: "CMP-416",
    kind: "complaint",
    detail: "Re-reported · 9 days ago",
    x: 500,
    y: 420,
  },
  {
    id: "repair-91",
    label: "Closed repair #91",
    kind: "repair",
    detail: "Temporary patch",
    x: 700,
    y: 104,
    isHighlighted: true,
  },
  {
    id: "repair-103",
    label: "Closed repair #103",
    kind: "repair",
    detail: "Temporary patch",
    x: 700,
    y: 288,
    isHighlighted: true,
  },
  {
    id: "contractor-urbanworks",
    label: "UrbanWorks",
    kind: "contractor",
    detail: "Same contractor",
    x: 886,
    y: 190,
    isHighlighted: true,
  },
  {
    id: "incident-18",
    label: "Rider fall",
    kind: "incident",
    detail: "Safety incident",
    x: 690,
    y: 455,
    isHighlighted: true,
  },
  {
    id: "area-sector2",
    label: "Sector 2",
    kind: "area",
    detail: "Service area",
    x: 872,
    y: 410,
    isHighlighted: true,
  },
  {
    id: "department-roads",
    label: "Roads & Mobility",
    kind: "department",
    detail: "Action owner",
    x: 1040,
    y: 410,
    isHighlighted: true,
  },
];

const graphEdges: GraphEdge[] = [
  {
    id: "new-location",
    source: "complaint-new",
    target: "location-f27",
    label: "LOCATED_AT",
    isHighlighted: true,
  },
  {
    id: "new-issue",
    source: "complaint-new",
    target: "issue-pothole",
    label: "ABOUT",
    isHighlighted: true,
  },
  {
    id: "401-location",
    source: "complaint-401",
    target: "location-f27",
    label: "LOCATED_AT",
  },
  {
    id: "407-location",
    source: "complaint-407",
    target: "location-f27",
    label: "LOCATED_AT",
    isHighlighted: true,
  },
  {
    id: "416-location",
    source: "complaint-416",
    target: "location-f27",
    label: "LOCATED_AT",
  },
  {
    id: "401-repair",
    source: "complaint-401",
    target: "repair-91",
    label: "HAS_REPAIR",
    isHighlighted: true,
  },
  {
    id: "407-after-91",
    source: "complaint-407",
    target: "repair-91",
    label: "REPORTED_AFTER",
    isHighlighted: true,
  },
  {
    id: "407-repair",
    source: "complaint-407",
    target: "repair-103",
    label: "HAS_REPAIR",
    isHighlighted: true,
  },
  {
    id: "416-after-103",
    source: "complaint-416",
    target: "repair-103",
    label: "REPORTED_AFTER",
    isHighlighted: true,
  },
  {
    id: "91-contractor",
    source: "repair-91",
    target: "contractor-urbanworks",
    label: "PERFORMED_BY",
    isHighlighted: true,
  },
  {
    id: "103-contractor",
    source: "repair-103",
    target: "contractor-urbanworks",
    label: "PERFORMED_BY",
    isHighlighted: true,
  },
  {
    id: "416-incident",
    source: "complaint-416",
    target: "incident-18",
    label: "HAS_INCIDENT",
    isHighlighted: true,
  },
  {
    id: "location-area",
    source: "location-f27",
    target: "area-sector2",
    label: "IN_AREA",
    isHighlighted: true,
  },
  {
    id: "area-department",
    source: "area-sector2",
    target: "department-roads",
    label: "OWNED_BY",
    isHighlighted: true,
  },
];

function extractFields(message: string): IntakeFields {
  const normalized = message.toLowerCase();
  const issueType =
    normalized.includes("garbage") || normalized.includes("waste")
      ? "Garbage overflow"
      : normalized.includes("leak") || normalized.includes("water")
        ? "Water leak"
        : normalized.includes("light") || normalized.includes("dark")
          ? "Broken streetlight"
          : "Pothole";
  const safetyRisk =
    /fell|fall|danger|unsafe|accident|rider|bike|child|injur/.test(normalized);
  const severity: IntakeFields["severity"] = safetyRisk
    ? "Critical"
    : /large|huge|urgent|again|still/.test(normalized)
      ? "High"
      : "Medium";
  const nearMatch = message.match(/(?:near|at|in)\s+([^.,]+)/i)?.[1]?.trim();
  const location = /f-?27|hsr|27th main/.test(normalized)
    ? "Road segment F-27, Sector 2"
    : nearMatch
      ? `${nearMatch} (reported location)`
      : "Location not specified";
  return {
    issueType,
    location,
    severity,
    timeContext: /today|morning|now|tonight/.test(normalized)
      ? "Reported today"
      : "Time not specified",
    safetyRisk,
    confidence: nearMatch || /f-?27|hsr|27th main/.test(normalized) ? 94 : 76,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function locationId(intake: IntakeFields): string {
  if (intake.location === "Road segment F-27, Sector 2") return "loc-f27";
  return `loc-${
    intake.location
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "unspecified"
  }`;
}

type GraphContext = {
  complaintId: string;
  locationName: string;
  relatedReports: number;
  repairCount: number;
  incidentCount: number;
  contractor: string;
  fakeClosures: number;
  actionOwner: string;
};

const seededContext: GraphContext = {
  complaintId: "CMP-428",
  locationName: "Road segment F-27, Sector 2",
  relatedReports: 5,
  repairCount: 2,
  incidentCount: 1,
  contractor: "UrbanWorks Infrastructure",
  fakeClosures: 2,
  actionOwner: "Roads & Mobility Department",
};

function buildGraph(context: GraphContext, intake: IntakeFields) {
  const nodes = graphNodes.map(node => {
    if (node.id === "complaint-new")
      return { ...node, detail: `${context.complaintId} · just submitted` };
    if (node.id === "location-f27")
      return {
        ...node,
        label: context.locationName.replace(", Sector 2", ""),
        detail: "Retrieved location entity",
      };
    if (node.id === "issue-pothole")
      return { ...node, label: intake.issueType, detail: "Extracted issue" };
    if (node.id === "contractor-urbanworks")
      return {
        ...node,
        label: context.contractor.replace(" Infrastructure", ""),
        detail: `${context.fakeClosures} repeat closures`,
      };
    if (node.id === "department-roads")
      return {
        ...node,
        label: context.actionOwner.replace(" Department", ""),
        detail: "Action owner",
      };
    return node;
  });
  return { nodes, edges: graphEdges };
}

function buildAnalysis(
  message: string,
  graphMode: ResolutionAnalysis["graphMode"],
  context: GraphContext
): ResolutionAnalysis {
  const intake = extractFields(message);
  const relatedWeight =
    context.relatedReports >= 5 ? 26 : Math.min(20, context.relatedReports * 5);
  const closureWeight = Math.min(24, context.fakeClosures * 12);
  const recurrenceWeight = context.fakeClosures > 0 ? 21 : 0;
  const incidentWeight = context.incidentCount > 0 ? 20 : 0;
  const score = Math.min(
    100,
    relatedWeight + closureWeight + recurrenceWeight + incidentWeight
  );
  const priority: ResolutionAnalysis["priority"] =
    score >= 85
      ? "CRITICAL"
      : score >= 65
        ? "HIGH"
        : score >= 40
          ? "MEDIUM"
          : "LOW";
  const recurrenceDays = context.relatedReports > 0 ? 18 : 0;
  const hasPattern = context.fakeClosures > 0;
  return {
    graphMode,
    complaintId: context.complaintId,
    intake,
    score,
    priority,
    recommendation: hasPattern
      ? "Escalate for a permanent repair and an on-site safety inspection. Do not route this as a routine duplicate ticket."
      : "Route this report to the responsible service owner for assessment and begin building its connected history.",
    actionOwner: context.actionOwner,
    relatedReports: context.relatedReports,
    recurrenceDays,
    fakeClosure: {
      contractor: context.contractor,
      closures: context.fakeClosures,
      insight: hasPattern
        ? `${context.fakeClosures} closed repair attempts by ${context.contractor} were followed by later reports at the same location.`
        : "No repeat-after-closure contractor pattern was found for this location yet.",
    },
    evidence: [
      {
        label: `${context.relatedReports} related reports`,
        detail: `Same location entity: ${context.locationName}`,
        weight: `+${relatedWeight}`,
      },
      {
        label: `${context.fakeClosures} repeat closures`,
        detail: hasPattern
          ? `Grouped under ${context.contractor}`
          : "No linked contractor recurrence",
        weight: `+${closureWeight}`,
      },
      {
        label: "Reported after closure",
        detail: hasPattern
          ? "Temporal REPORTED_AFTER links prove recurrence after a closed repair"
          : "No temporal recurrence link found",
        weight: `+${recurrenceWeight}`,
      },
      {
        label: `${context.incidentCount} linked safety incident`,
        detail: context.incidentCount
          ? "Rider fall recorded near the same location"
          : "No linked incident recorded",
        weight: `+${incidentWeight}`,
      },
    ],
    graph: buildGraph(context, intake),
    cypher: {
      context: {
        title: "Context retrieval: the path behind this decision",
        query: CYPHER.retrieveContext,
      },
      fakeClosure: {
        title: "Contractor recurrence: closure followed by a new report",
        query: CYPHER.fakeClosure,
      },
    },
    followUp: {
      message: "It is still dangerous. What happens next?",
      withoutGraph:
        "I’m sorry this is still happening. I’ve logged your issue and will forward it for review.",
      withGraph: hasPattern
        ? `I found ${context.relatedReports} related reports at this location, ${context.fakeClosures} closed repairs by ${context.contractor}, and a linked safety incident. The next step is a permanent repair and safety inspection—not another routine ticket.`
        : "I found your location and issue context. The report has been routed to the responsible owner for assessment.",
    },
  };
}

export interface GraphRepository {
  analyze(message: string): Promise<ResolutionAnalysis>;
}

export class DemoGraphRepository implements GraphRepository {
  async analyze(message: string): Promise<ResolutionAnalysis> {
    return buildAnalysis(message, "Synthetic demo graph", seededContext);
  }
}

/** Aura implementation: write the report, retrieve its connected context, and calculate the returned decision from those query records. */
export class Neo4jGraphRepository implements GraphRepository {
  private readonly driver: Driver;
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI as string,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME as string,
        process.env.NEO4J_PASSWORD as string
      )
    );
  }

  private contextFromRecords(
    contextRecord:
      | Awaited<
          ReturnType<ReturnType<Driver["session"]>["run"]>
        >["records"][number]
      | undefined,
    recurrenceRecord:
      | Awaited<
          ReturnType<ReturnType<Driver["session"]>["run"]>
        >["records"][number]
      | undefined,
    complaintId: string,
    fallbackLocation: string
  ): GraphContext {
    return {
      complaintId: String(contextRecord?.get("complaintId") ?? complaintId),
      locationName: String(
        contextRecord?.get("locationName") ?? fallbackLocation
      ),
      relatedReports: toNumber(contextRecord?.get("relatedReports")),
      repairCount: toNumber(contextRecord?.get("repairCount")),
      incidentCount: toNumber(contextRecord?.get("incidentCount")),
      contractor: String(
        recurrenceRecord?.get("contractor") ??
          contextRecord?.get("contractor") ??
          toStrings(contextRecord?.get("contractors"))[0] ??
          "Unassigned contractor"
      ),
      fakeClosures: toNumber(recurrenceRecord?.get("repeatClosures")),
      actionOwner: String(contextRecord?.get("actionOwner") ?? "Unassigned"),
    };
  }

  async demoScenario(): Promise<ResolutionAnalysis> {
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || "neo4j",
    });
    try {
      const contextResult = await session.run(CYPHER.demoContext);
      const recurrenceResult = await session.run(CYPHER.fakeClosure);
      const context = this.contextFromRecords(
        contextResult.records[0],
        recurrenceResult.records[0],
        "CMP-LIVE-DEMO",
        "Road segment F-27, Sector 2"
      );
      if (!context.relatedReports)
        throw new Error(
          "Aura seed graph is empty or the demo location is missing"
        );
      return buildAnalysis(
        "A delivery rider slipped near Road segment F-27. It is still dangerous.",
        "Neo4j Aura",
        context
      );
    } catch (error) {
      console.error(
        "[ResolveLink] Aura demo read failed; using synthetic fallback:",
        error instanceof Error ? error.message : error
      );
      return initialDemoAnalysis;
    } finally {
      await session.close();
      await this.driver.close();
    }
  }

  async analyze(message: string): Promise<ResolutionAnalysis> {
    const intake = extractFields(message);
    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || "neo4j",
    });
    try {
      await session.run(CYPHER.upsertComplaint, {
        complaintId,
        message,
        locationId: locationId(intake),
        locationName: intake.location,
        issueType: intake.issueType,
        severity: intake.severity,
      });
      const contextResult = await session.run(CYPHER.retrieveContext, {
        complaintId,
      });
      const recurrenceResult = await session.run(CYPHER.fakeClosure);
      const context = this.contextFromRecords(
        contextResult.records[0],
        recurrenceResult.records[0],
        complaintId,
        intake.location
      );
      return buildAnalysis(message, "Neo4j Aura", context);
    } catch (error) {
      console.error(
        "[ResolveLink] Aura write/read failed; using synthetic fallback:",
        error instanceof Error ? error.message : error
      );
      return buildAnalysis(message, "Synthetic demo graph", seededContext);
    } finally {
      await session.close();
      await this.driver.close();
    }
  }
}

export function getGraphRepository(): GraphRepository {
  const configured = Boolean(
    process.env.NEO4J_URI &&
      process.env.NEO4J_USERNAME &&
      process.env.NEO4J_PASSWORD
  );
  return configured ? new Neo4jGraphRepository() : new DemoGraphRepository();
}

export async function getInitialDemoScenario(): Promise<ResolutionAnalysis> {
  const configured = Boolean(
    process.env.NEO4J_URI &&
      process.env.NEO4J_USERNAME &&
      process.env.NEO4J_PASSWORD
  );
  return configured
    ? new Neo4jGraphRepository().demoScenario()
    : initialDemoAnalysis;
}

export const initialDemoAnalysis = buildAnalysis(
  "A delivery rider slipped near Road segment F-27. It is still dangerous.",
  "Synthetic demo graph",
  seededContext
);
