import { useState } from "react";
import { useNavigate } from "react-router";

export default function Build() {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [guardrails, setGuardrails] = useState("");
  const [referenceMaterial, setReferenceMaterial] = useState("");

  const [step, setStep] = useState<"describe" | "edit">("describe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
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
      setStep("edit");
    } catch {
      setError("Something went wrong generating your app. Please try again.");
    } finally {
      setLoading(false);
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

  if (shareUrl) {
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
              onClick={() => navigate(`/app/${shareUrl.split("/app/")[1]}`)}
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

  return (
    <div className="container">
      <h1 className="page-title">
        {step === "describe" ? "Create a new app" : "Configure your app"}
      </h1>
      <p className="page-subtitle">
        {step === "describe"
          ? "Describe the AI app you want to build. Mention the subject, grade level, and what kind of support it should provide."
          : "Review and edit the generated configuration. These fields control how your AI assistant will behave."}
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
            disabled={loading || !description.trim()}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? "Generating..." : "Generate App"}
          </button>
        </div>
      )}

      {step === "edit" && (
        <div className="card">
          <div className="field-group">
            <label className="field-label">App Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Background</label>
            <p className="field-hint">
              Who is this AI assistant? Define its role, personality, and expertise.
            </p>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              rows={5}
              className="input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Workflow</label>
            <p className="field-hint">
              How should a conversation go, step by step?
            </p>
            <textarea
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value)}
              rows={5}
              className="input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Guardrails</label>
            <p className="field-hint">
              What boundaries must this assistant maintain?
            </p>
            <textarea
              value={guardrails}
              onChange={(e) => setGuardrails(e.target.value)}
              rows={5}
              className="input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Reference Material</label>
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
            <p className="field-hint">
              Paste any curriculum, rubrics, or content the AI should reference.
            </p>
            <textarea
              value={referenceMaterial}
              onChange={(e) => setReferenceMaterial(e.target.value)}
              rows={4}
              className="input"
            />
          </div>

          <div className="btn-row">
            <button onClick={() => setStep("describe")} className="btn btn-secondary">
              Back
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