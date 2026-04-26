"use client";

export default function PrintButton() {
  return (
    <button 
      className="btn-primary" 
      onClick={() => window.print()}
      style={{ padding: "12px 24px", fontSize: "1rem" }}
    >
      Download / Print Sertifikat
    </button>
  );
}
