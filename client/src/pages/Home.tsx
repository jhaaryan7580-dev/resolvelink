import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Database,
  FileSearch,
  MapPin,
  Network,
  Send,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const examples = [
  "A delivery rider slipped near Road segment F-27. It is still dangerous.",
  "Another large pothole has opened again at Road segment F-27.",
  "The temporary patch near Road segment F-27 failed again.",
];

const kindColors: Record<string, string> = {
  complaint: "#C2412D",
  location: "#4A7569",
  area: "#8B6A43",
  issue: "#B17A25",
  repair: "#7866A6",
  contractor: "#275A78",
  incident: "#AF4130",
  department: "#5F7452",
};

function GraphView({
  graph,
  selectedId,
  onSelect,
}: {
  graph: { nodes: Array<any>; edges: Array<any> };
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const nodeById = Object.fromEntries(
    graph.nodes.map((node: any) => [node.id, node])
  );
  return (
    <div
      className="graph-canvas"
      aria-label="ResolveLink connected issue graph"
    >
      <svg
        viewBox="0 0 1140 540"
        role="img"
        aria-label="Interactive connected graph of the new report, location, prior reports, repairs, contractor, safety incident, and department"
      >
        {graph.edges.map((edge: any) => {
          const source = nodeById[edge.source];
          const target = nodeById[edge.target];
          if (!source || !target) return null;
          const mx = (source.x + target.x) / 2;
          const my = (source.y + target.y) / 2;
          const selectedPath =
            edge.source === selectedId || edge.target === selectedId;
          return (
            <g key={edge.id}>
              <line
                className={`edge ${edge.isHighlighted || selectedPath ? "highlight" : ""}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
              />
              {(edge.isHighlighted || selectedPath) && (
                <text className="edge-label" x={mx + 4} y={my - 5}>
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        {graph.nodes.map((node: any) => (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`Explore ${node.label}: ${node.detail}`}
            className={`graph-node ${node.isHighlighted ? "highlighted" : ""} ${node.isNew ? "new-node" : ""} ${selectedId === node.id ? "selected" : ""}`}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => onSelect(node.id)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(node.id);
              }
            }}
          >
            <circle
              r={node.isNew ? 34 : 29}
              style={node.isNew ? undefined : { stroke: kindColors[node.kind] }}
            />
            <circle r="5" fill={kindColors[node.kind]} stroke="none" />
            <text className="node-main" x="39" y="-3">
              {node.label}
            </text>
            <text className="node-detail" x="39" y="12">
              {node.detail}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const scenario = trpc.resolve.scenario.useQuery();
  const analyze = trpc.resolve.analyze.useMutation();
  const [reportText, setReportText] = useState(examples[0]);
  const [withGraph, setWithGraph] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState("contractor-urbanworks");
  const [cypherMode, setCypherMode] = useState<"context" | "fakeClosure">(
    "fakeClosure"
  );
  const analysis = analyze.data ?? scenario.data;

  if (!analysis) {
    return (
      <main className="resolve-shell">
        <div className="page-wrap">
          <div className="topbar">
            <div className="brand">
              <span className="brand-mark" />
              RESOLVELINK
            </div>
          </div>
          <p style={{ padding: "64px 0" }}>
            Loading the connected issue graph…
          </p>
        </div>
      </main>
    );
  }

  const submit = () => analyze.mutate({ message: reportText });
  const selectedNode =
    analysis.graph.nodes.find((node: any) => node.id === selectedNodeId) ??
    analysis.graph.nodes[0];
  const cypher = analysis.cypher[cypherMode];

  return (
    <main className="resolve-shell">
      <div className="page-wrap">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" />
            RESOLVELINK
          </div>
          <div className="top-status">
            <span className="status-dot" /> <span>{analysis.graphMode}</span>
            <span>·</span>
            <span>Graph-first resolution</span>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">
              From repeated reports to resolved problems
            </p>
            <h1>
              Reports alone don’t fix places.
              <br />
              Connections do.
            </h1>
          </div>
          <p className="hero-copy">
            ResolveLink traces the history behind a problem, surfaces repeated
            failures, and sends the next action to the right owner—with visible
            evidence.
          </p>
        </section>

        <div className="notice">
          <strong>Demo data is synthetic and transparent.</strong> This planted
          scenario proves a road stretch was closed twice by the same
          contractor, then reported again through explicit{" "}
          <span className="mono">REPORTED_AFTER</span> relationships. Aura mode
          executes the same Cypher paths against live graph data.
        </div>

        <section className="workspace">
          <aside className="intake-pane">
            <p className="section-kicker">01 / Issue intake</p>
            <h2>Report what you see.</h2>
            <p className="small-copy">
              This focused demo is seeded around road segment F-27. Describe the
              failure naturally; ResolveLink extracts the signal and retrieves
              its connected history.
            </p>
            <textarea
              className="report-box"
              value={reportText}
              onChange={event => setReportText(event.target.value)}
              aria-label="Describe the problem"
            />
            <div className="example-row">
              <span className="example-label">Try:</span>
              {examples.map((example, index) => (
                <button
                  className="example-chip"
                  type="button"
                  onClick={() => setReportText(example)}
                  key={example}
                >
                  sample {index + 1}
                </button>
              ))}
            </div>
            <button
              className="analyze-btn"
              type="button"
              onClick={submit}
              disabled={analyze.isPending || reportText.trim().length < 8}
            >
              {analyze.isPending ? (
                <>
                  <Sparkles size={15} /> Building graph context…
                </>
              ) : (
                <>
                  <Send size={15} /> Connect report to resolution history{" "}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            {analyze.error && (
              <p
                className="small-copy"
                style={{ color: "#ad3e2a", marginTop: 14 }}
              >
                The graph analysis could not run. Please try the report again.
              </p>
            )}

            <div className="extraction">
              <p className="section-kicker">Structured intake</p>
              <div className="extraction-grid">
                <div className="field">
                  <span className="field-label">Issue type</span>
                  <span className="field-value">
                    {analysis.intake.issueType}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Location entity</span>
                  <span className="field-value">
                    {analysis.intake.location}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Urgency cue</span>
                  <span className="field-value">
                    {analysis.intake.severity}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Safety signal</span>
                  <span
                    className={`field-value ${analysis.intake.safetyRisk ? "field-risk" : ""}`}
                  >
                    {analysis.intake.safetyRisk
                      ? "Risk detected"
                      : "No direct cue"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Time context</span>
                  <span className="field-value">
                    {analysis.intake.timeContext}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Parser confidence</span>
                  <span className="field-value">
                    {analysis.intake.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <div className="analysis-pane">
            <div className="analysis-header">
              <div>
                <p className="section-kicker">02 / Resolution intelligence</p>
                <h2>This is a recurring failure, not a new ticket.</h2>
              </div>
              <div className="priority-stamp">
                PRIORITY<b>{analysis.priority}</b>
              </div>
            </div>
            <div className="score-strip">
              <div className="score-item">
                <span className="score-label">Connected reports</span>
                <span className="score-value">{analysis.relatedReports}</span>
              </div>
              <div className="score-divider" />
              <div className="score-item">
                <span className="score-label">Recurrence window</span>
                <span className="score-value">
                  {analysis.recurrenceDays} days
                </span>
              </div>
              <div className="score-divider" />
              <div className="score-item">
                <span className="score-label">Priority score</span>
                <span className="score-value orange">{analysis.score}/100</span>
              </div>
            </div>

            <section className="graph-section">
              <div className="graph-caption">
                <h3>
                  <Network
                    size={15}
                    style={{
                      verticalAlign: "-3px",
                      marginRight: 6,
                      color: "#c2412d",
                    }}
                  />
                  Retrieved subgraph
                </h3>
                <div className="graph-legend">
                  <span className="legend-line" /> click any node to inspect its
                  path
                </div>
              </div>
              <GraphView
                graph={analysis.graph}
                selectedId={selectedNodeId}
                onSelect={setSelectedNodeId}
              />
              <div className="selected-node-note">
                <span className="mono">
                  SELECTED {selectedNode.kind.toUpperCase()}
                </span>
                <strong>{selectedNode.label}</strong>
                <span>{selectedNode.detail}</span>
              </div>
            </section>

            <section className="findings">
              <div className="evidence-list">
                <p className="evidence-title">
                  <FileSearch
                    size={13}
                    style={{ verticalAlign: "-2px", marginRight: 5 }}
                  />{" "}
                  Why this score
                </p>
                {analysis.evidence.map((item, index) => (
                  <div className="evidence-row" key={item.label}>
                    <span className="evidence-num">0{index + 1}</span>
                    <span>
                      <span className="evidence-label">{item.label}</span>
                      <span className="evidence-detail">{item.detail}</span>
                    </span>
                    <span className="evidence-weight">{item.weight}</span>
                  </div>
                ))}
                <div className="recommendation">
                  <span className="recommendation-label">
                    <AlertTriangle
                      size={12}
                      style={{ verticalAlign: "-2px", marginRight: 5 }}
                    />{" "}
                    Recommended next action
                  </span>
                  <p>{analysis.recommendation}</p>
                  <p className="owner">
                    <MapPin
                      size={11}
                      style={{ verticalAlign: "-2px", marginRight: 3 }}
                    />
                    Route to: {analysis.actionOwner}
                  </p>
                </div>
              </div>

              <div className="memory-pane">
                <p className="memory-title">
                  <CircleDot
                    size={13}
                    style={{ verticalAlign: "-2px", marginRight: 5 }}
                  />{" "}
                  Follow-up memory mode
                </p>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${!withGraph ? "active" : ""}`}
                    onClick={() => setWithGraph(false)}
                  >
                    Without graph
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${withGraph ? "active" : ""}`}
                    onClick={() => setWithGraph(true)}
                  >
                    With graph
                  </button>
                </div>
                <p className="followup">“{analysis.followUp.message}”</p>
                <div className={`memory-answer ${withGraph ? "graph-on" : ""}`}>
                  {withGraph
                    ? analysis.followUp.withGraph
                    : analysis.followUp.withoutGraph}
                </div>
                <p className="memory-note">
                  {withGraph
                    ? "The answer is grounded in the retrieved complaint → location → repair → contractor → incident path."
                    : "A standard ticket response cannot see the connected repair history."}
                </p>
              </div>
            </section>

            <section className="cypher-panel">
              <div className="cypher-head">
                <p className="cypher-title">
                  <Database
                    size={13}
                    style={{ verticalAlign: "-2px", marginRight: 5 }}
                  />
                  {cypher.title}
                </p>
                <span className="cypher-tag">Neo4j Cypher</span>
              </div>
              <div className="cypher-tabs">
                <button
                  type="button"
                  className={cypherMode === "fakeClosure" ? "active" : ""}
                  onClick={() => setCypherMode("fakeClosure")}
                >
                  Repeat-after-closure
                </button>
                <button
                  type="button"
                  className={cypherMode === "context" ? "active" : ""}
                  onClick={() => setCypherMode("context")}
                >
                  Context retrieval
                </button>
              </div>
              <pre>{cypher.query}</pre>
            </section>
          </div>
        </section>

        <footer className="footer-note">
          <span>
            <CheckCircle2
              size={13}
              style={{
                verticalAlign: "-2px",
                marginRight: 4,
                color: "#27835c",
              }}
            />
            One submitted report becomes a connected, explainable resolution
            decision.
          </span>
          <span className="mono">
            {analysis.complaintId} · {analysis.graphMode} · ResolveLink
          </span>
        </footer>
      </div>
    </main>
  );
}
