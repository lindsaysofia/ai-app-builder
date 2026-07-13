import { useState } from "react";

export default function Build() {
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [guardrails, setGuardrails] = useState("");
  const [referenceMaterial, setReferenceMaterial] = useState("");

  const [step, setStep] = useState<"describe" | "generating" | "edit">("describe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    background: true,
    workflow: false,
    guardrails: false,
    referenceMaterial: false,
  });

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setName(data.name);
      setBackground(data.background);
      setWorkflow(data.workflow);
      setGuardrails(data.guardrails);

      // Brief pause so the user sees the transition
      setTimeout(() => {
        setStep("edit");
        setOpenSections({
          background: true,
          workflow: false,
          guardrails: false,
          referenceMaterial: false,
        });
      }, 600);
    } catch {
      setError("Something went wrong generating your app. Please try again.");
      setStep("describe");
    }
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          background,
          workflow,
          guardrails,
          referenceMaterial: referenceMaterial || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setShareUrl(`${window.location.origin}/app/${data.id}`);
    } catch {
      setError("Something went wrong saving your app. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setShareUrl("");
    setStep("describe");
    setDescription("");
    setName("");
    setBackground("");
    setWorkflow("");
    setGuardrails("");
    setReferenceMaterial("");
  }

  // Share URL screen
  if (shareUrl) {
    const appId = shareUrl.split("/app/")[1];
    return (
      <div className="container">
        <div className="card success-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 className="page-title">Your app is live!</h1>
          <p className="page-subtitle" style={{ marginBottom: 20 }}>
            Share this link with your students to start using it.
          </p>
          <div className="share-row">
            <input type="text" readOnly value={shareUrl} className="input" />
            <button onClick={handleCopy} className="btn btn-primary">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <button
              onClick={() => window.open(`/app/${appId}`, "_blank")}
              className="btn btn-primary"
            >
              Preview App
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Build Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating screen
  if (step === "generating") {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={spinnerStyle} />
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>
            Building your app...
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
            Generating background, workflow, and guardrails from your description.
          </p>
        </div>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">
        {step === "describe" ? "Create a new app" : "Configure your app"}
      </h1>
      <p className="page-subtitle">
        {step === "describe"
          ? "Describe the AI app you want to build. Mention the subject, grade level, and what kind of support it should provide."
          : "Review and edit each section below. Click a section to expand or collapse it."}
      </p>

      {error && <div className="error-msg">{error}</div>}

      {step === "describe" && (
        <div className="card">
          <div className="field-group">
            <label className="field-label">What do you want to build?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g. "Build me a friendly mental health app that helps high school students work through overwhelming feelings using CBT techniques"'
              rows={5}
              className="input"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            Generate App
          </button>
        </div>
      )}

      {step === "edit" && (
        <div>
          {/* App Name - always visible */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="field-group" style={{ marginBottom: 0 }}>
              <label className="field-label">App Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Original description - shown for reference */}
          <div
            className="card"
            style={{
              marginBottom: 12,
              background: "var(--color-bg)",
              border: "1px dashed var(--color-border)",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              <strong>Your prompt:</strong> {description}
            </p>
          </div>

          {/* Collapsible sections */}
          <CollapsibleSection
            title="Background"
            hint="Who is this AI assistant? Its role, personality, and expertise."
            value={background}
            onChange={setBackground}
            isOpen={openSections.background}
            onToggle={() => toggleSection("background")}
          />
          <CollapsibleSection
            title="Workflow"
            hint="How should a conversation go, step by step?"
            value={workflow}
            onChange={setWorkflow}
            isOpen={openSections.workflow}
            onToggle={() => toggleSection("workflow")}
          />
          <CollapsibleSection
            title="Guardrails"
            hint="What boundaries must this assistant maintain?"
            value={guardrails}
            onChange={setGuardrails}
            isOpen={openSections.guardrails}
            onToggle={() => toggleSection("guardrails")}
          />
          <CollapsibleSection
            title="Reference Material"
            hint="Paste any curriculum, rubrics, or content the AI should reference."
            value={referenceMaterial}
            onChange={setReferenceMaterial}
            isOpen={openSections.referenceMaterial}
            onToggle={() => toggleSection("referenceMaterial")}
            optional
          />

          <div className="btn-row">
            <button onClick={() => setStep("describe")} className="btn btn-secondary">
              Start Over
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? "Saving..." : "Save & Get Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  hint,
  value,
  onChange,
  isOpen,
  onToggle,
  optional,
}: {
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  optional?: boolean;
}) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
            {title}
          </span>
          {optional && (
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                fontWeight: 400,
                marginLeft: 6,
              }}
            >
              Optional
            </span>
          )}
          {!isOpen && value && (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 480,
              }}
            >
              {value}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: 18,
            color: "var(--color-text-secondary)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ marginTop: 12 }}>
          <p className="field-hint">{hint}</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="input"
          />
        </div>
      )}
    </div>
  );
}

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "3px solid var(--color-border)",
  borderTopColor: "var(--color-primary)",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  margin: "0 auto",
};