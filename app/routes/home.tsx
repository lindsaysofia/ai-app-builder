import { Link } from "react-router";

export default function Home() {
  return (
    <div className="container" style={{ textAlign: "center", paddingTop: 120 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        AI App Builder for Educators
      </h1>
      <p
        className="page-subtitle"
        style={{ maxWidth: 460, margin: "0 auto 32px" }}
      >
        Describe the AI tool you want for your classroom, and we'll generate a
        ready-to-share assistant in minutes.
      </p>
      <Link to="/build" className="btn btn-primary" style={{ textDecoration: "none" }}>
        Create an App
      </Link>
    </div>
  );
}