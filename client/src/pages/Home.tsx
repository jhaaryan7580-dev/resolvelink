import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  MapPin,
  Network,
  PhoneCall,
  Send,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const examples = [
  "A delivery rider slipped near Road segment F-27. It is still dangerous.",
  "Another large pothole has opened again at Road segment F-27.",
  "The temporary patch near Road segment F-27 failed again.",
];

const authorityChannels = [
  {
    name: "BBMP civic helpline",
    detail: "Primary Bengaluru complaint route",
    value: "1533",
    href: "tel:1533",
    kind: "Call",
  },
  {
    name: "Namma Bengaluru / Sahaaya 2.0",
    detail: "Register and track civic grievances",
    value: "Open portal",
    href: "https://nammabengaluru.org.in/",
    kind: "Official portal",
  },
  {
    name: "Karnataka Praja Seve",
    detail: "State-level escalation and tracking",
    value: "1902",
    href: "tel:1902",
    kind: "Call",
  },
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
    <div className="graph-canvas" aria-label="ResolveLink connection map">
      <svg
        viewBox="0 0 1140 540"
        role="img"
        aria-label="Interactive connection map showing how the report links to history, repairs, a contractor, a safety incident, and the responsible team"
      >
        {graph.edges.map((edge: any) => {
          const source = nodeById[edge.source];
          const target = nodeById[edge.target];
          if (!source || !target) return null;
          const selectedPath =
            edge.source === selectedId || edge.target === selectedId;
          const mx = (source.x + target.x) / 2;
          const my = (source.y + target.y) / 2;
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
  const [showTechnical, setShowTechnical] = useState(false);
  const [location, setLocation] = useState("HSR Layout · Road segment F-27");
  const [briefCopied, setBriefCopied] = useState(false);
  const analysis = analyze.data ?? scenario.data;

  if (!analysis)
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

  const submit = () =>
    analyze.mutate({ message: `${reportText} at ${location}` });
  const selectedNode =
    analysis.graph.nodes.find((node: any) => node.id === selectedNodeId) ??
    analysis.graph.nodes[0];
  const copyFollowUpBrief = async () => {
    const brief = `ResolveLink follow-up brief\nCase: ${analysis.complaintId}\nLocation: ${analysis.intake.location}\nIssue: ${analysis.intake.issueType}\nPriority: ${analysis.priority} (${analysis.score}/100)\nEvidence: ${analysis.relatedReports} related reports, ${analysis.fakeClosure.closures} repeat closures by ${analysis.fakeClosure.contractor}, ${analysis.evidence[3]?.label ?? "linked safety evidence"}\nRecommended action: ${analysis.recommendation}`;
    try {
      await navigator.clipboard.writeText(brief);
      setBriefCopied(true);
      window.setTimeout(() => setBriefCopied(false), 2200);
    } catch {
      setBriefCopied(false);
    }
  };

  return (
    <main className="resolve-shell">
      <div className="page-wrap">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" />
            RESOLVELINK
          </div>
          <div className="top-status">
            <span className="status-dot" />
            <span>Bengaluru demo</span>
            <span>·</span>
            <span>Citizen + resolver view</span>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">A clearer path from report to resolution</p>
            <h1>
              Tell us what happened.
              <br />
              We’ll connect the dots.
            </h1>
          </div>
          <p className="hero-copy">
            ResolveLink helps people report a problem once—and helps the team
            responsible see the full history before deciding what to do next.
          </p>
        </section>

        <div className="notice">
          <strong>How this demo works:</strong> your report is matched to a
          small, transparent Bengaluru demo graph. The numbers below are
          synthetic: <b>5 linked reports</b>, <b>2 past repairs</b>, and{" "}
          <b>1 safety incident</b>.
        </div>

        <section className="workspace">
          <aside className="intake-pane">
            <div className="step-heading">
              <span>01</span>
              <div>
                <p className="section-kicker">Choose the place</p>
                <h2>Where is the problem?</h2>
              </div>
            </div>
            <p className="small-copy">
              We start with a place because problems become meaningful when they
              are connected to the same spot over time.
            </p>
            <div className="location-fields">
              <label>
                <span>Country</span>
                <select defaultValue="India">
                  <option>India</option>
                  <option disabled>Other countries — coming soon</option>
                </select>
              </label>
              <label>
                <span>State</span>
                <select defaultValue="Karnataka">
                  <option>Karnataka</option>
                  <option disabled>Other states — coming soon</option>
                </select>
              </label>
              <label>
                <span>City</span>
                <select defaultValue="Bengaluru">
                  <option>Bengaluru</option>
                  <option disabled>Other cities — coming soon</option>
                </select>
              </label>
              <label>
                <span>Area</span>
                <select
                  value={location}
                  onChange={event => setLocation(event.target.value)}
                >
                  <option>HSR Layout · Road segment F-27</option>
                  <option>HSR Layout · Sector 2</option>
                  <option disabled>More Bengaluru areas — coming soon</option>
                </select>
              </label>
            </div>

            <div className="step-heading report-heading">
              <span>02</span>
              <div>
                <p className="section-kicker">Describe the problem</p>
                <h2>What did you notice?</h2>
              </div>
            </div>
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
                  <Sparkles size={15} /> Connecting your report…
                </>
              ) : (
                <>
                  <Send size={15} /> See what your report connects to{" "}
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
              <p className="section-kicker">What ResolveLink heard</p>
              <div className="extraction-grid">
                <div className="field">
                  <span className="field-label">Issue</span>
                  <span className="field-value">
                    {analysis.intake.issueType}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Place</span>
                  <span className="field-value">
                    {analysis.intake.location}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Urgency</span>
                  <span className="field-value">
                    {analysis.intake.severity}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Safety</span>
                  <span
                    className={`field-value ${analysis.intake.safetyRisk ? "field-risk" : ""}`}
                  >
                    {analysis.intake.safetyRisk
                      ? "Risk detected"
                      : "No direct cue"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">When</span>
                  <span className="field-value">
                    {analysis.intake.timeContext}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Confidence</span>
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
                <p className="section-kicker">03 / What we found</p>
                <h2>Your report is part of a bigger story.</h2>
                <p className="analysis-subtitle">
                  This is why the system raised the case to{" "}
                  <strong>{analysis.priority}</strong>.
                </p>
              </div>
              <div className="priority-stamp">
                PRIORITY<b>{analysis.priority}</b>
              </div>
            </div>

            <div className="plain-reason">
              <div className="reason-score">
                <span className="score-label">Priority score</span>
                <strong>
                  {analysis.score}
                  <small>/100</small>
                </strong>
              </div>
              <div className="reason-copy">
                <strong>The graph changed the decision.</strong>
                <span>
                  It found connected history that a single ticket would miss.
                </span>
              </div>
            </div>

            <div className="connection-story">
              <p className="evidence-title">
                <Network
                  size={13}
                  style={{ verticalAlign: "-2px", marginRight: 5 }}
                />{" "}
                How your report became critical
              </p>
              <div className="story-grid">
                <div className="story-card">
                  <span className="story-number">1</span>
                  <div>
                    <strong>Your report → the same place</strong>
                    <span>
                      Connected to {analysis.relatedReports} reports near{" "}
                      {analysis.graph.nodes.find(
                        (node: any) => node.id === "location-f27"
                      )?.label ?? "this location"}
                      .
                    </span>
                  </div>
                </div>
                <div className="story-card">
                  <span className="story-number">2</span>
                  <div>
                    <strong>That place → repair history</strong>
                    <span>
                      {analysis.fakeClosure.closures} repairs were marked closed
                      by {analysis.fakeClosure.contractor}.
                    </span>
                  </div>
                </div>
                <div className="story-card">
                  <span className="story-number">3</span>
                  <div>
                    <strong>Repair → later report</strong>
                    <span>
                      New reports came back after the repairs. The issue was not
                      truly resolved.
                    </span>
                  </div>
                </div>
                <div className="story-card">
                  <span className="story-number">4</span>
                  <div>
                    <strong>History → right next action</strong>
                    <span>
                      A safety incident means this needs permanent repair, not
                      another routine ticket.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-head">
                <div>
                  <p className="section-kicker">Your report is being tracked</p>
                  <h3>Resolution trail · {analysis.complaintId}</h3>
                </div>
                <span className="status-live">LIVE DEMO STATUS</span>
              </div>
              <div className="status-line">
                <div className="status-step complete">
                  <span>
                    <Check size={13} />
                  </span>
                  <strong>Reported</strong>
                  <small>Just now</small>
                </div>
                <div className="status-step complete">
                  <span>
                    <Check size={13} />
                  </span>
                  <strong>Connected</strong>
                  <small>{analysis.relatedReports} related reports</small>
                </div>
                <div className="status-step complete">
                  <span>
                    <Check size={13} />
                  </span>
                  <strong>Prioritized</strong>
                  <small>
                    {analysis.priority} · {analysis.score}/100
                  </small>
                </div>
                <div className="status-step current">
                  <span>4</span>
                  <strong>Routed</strong>
                  <small>{analysis.actionOwner}</small>
                </div>
              </div>
            </div>

            <section className="graph-section">
              <div className="graph-caption">
                <div>
                  <h3>
                    <Network
                      size={15}
                      style={{
                        verticalAlign: "-3px",
                        marginRight: 6,
                        color: "#c2412d",
                      }}
                    />
                    Connection map
                  </h3>
                  <span className="graph-helper">
                    Circles are things. Lines are relationships. Click a circle
                    to see what it means.
                  </span>
                </div>
                <div className="graph-legend">
                  <span className="legend-line" /> retrieved path
                </div>
              </div>
              <GraphView
                graph={analysis.graph}
                selectedId={selectedNode.id}
                onSelect={setSelectedNodeId}
              />
              <div className="selected-node-note">
                <span className="mono">YOU ARE EXPLORING</span>
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
                  Evidence used
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
                  Follow-up memory
                </p>
                <p className="followup">“{analysis.followUp.message}”</p>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${!withGraph ? "active" : ""}`}
                    onClick={() => setWithGraph(false)}
                  >
                    Basic reply
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${withGraph ? "active" : ""}`}
                    onClick={() => setWithGraph(true)}
                  >
                    Connected reply
                  </button>
                </div>
                <div className={`memory-answer ${withGraph ? "graph-on" : ""}`}>
                  {withGraph
                    ? analysis.followUp.withGraph
                    : analysis.followUp.withoutGraph}
                </div>
                <p className="memory-note">
                  {withGraph
                    ? "This reply remembers what happened after earlier repairs."
                    : "Without connected history, the reply can only acknowledge the new message."}
                </p>
                <div className="contact-card">
                  <div className="contact-icon">
                    <PhoneCall size={15} />
                  </div>
                  <div>
                    <span className="field-label">Follow-up route</span>
                    <strong>{analysis.actionOwner}</strong>
                    <span>Responsible team linked from the area graph.</span>
                  </div>
                </div>
                <div className="authority-box">
                  <div className="authority-heading">
                    <span className="field-label">
                      Official channels for this Bengaluru demo
                    </span>
                    <span className="verified-label">VERIFIED ROUTES</span>
                  </div>
                  {authorityChannels.map(channel => (
                    <a
                      className="authority-link"
                      href={channel.href}
                      target={
                        channel.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        channel.href.startsWith("http")
                          ? "noreferrer"
                          : undefined
                      }
                      key={channel.name}
                    >
                      <span>
                        <strong>{channel.name}</strong>
                        <small>{channel.detail}</small>
                      </span>
                      <b>{channel.value}</b>
                      <ExternalLink size={12} />
                    </a>
                  ))}
                  <button
                    type="button"
                    className="copy-brief"
                    onClick={copyFollowUpBrief}
                  >
                    <Copy size={12} />{" "}
                    {briefCopied
                      ? "Follow-up brief copied"
                      : "Copy evidence brief before you contact them"}
                  </button>
                  <p className="source-note">
                    Routes: BBMP 1533 · Namma Bengaluru / Sahaaya 2.0 ·
                    Karnataka Praja Seve 1902.
                  </p>
                </div>
              </div>
            </section>

            <div className="technical-toggle">
              <button
                type="button"
                onClick={() => setShowTechnical(!showTechnical)}
              >
                <Database size={13} />{" "}
                {showTechnical
                  ? "Hide technical details"
                  : "For builders: show how Neo4j powers this"}
              </button>
              {showTechnical && (
                <div className="technical-panel">
                  <p>
                    <strong>Graph implementation:</strong> Neo4j connects the
                    report to the location, previous reports, closed repairs,
                    contractor, safety incident, and responsible department. The
                    repeat-after-closure query uses explicit{" "}
                    <span className="mono">REPORTED_AFTER</span> relationships
                    rather than guessing from text.
                  </p>
                  <pre>{analysis.cypher.fakeClosure.query}</pre>
                </div>
              )}
            </div>
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
            One report. One connected history. A clearer next action.
          </span>
          <span className="mono">
            {analysis.complaintId} · {analysis.graphMode} · ResolveLink
          </span>
        </footer>
      </div>
    </main>
  );
}
