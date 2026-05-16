"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const data = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Der skete en fejl");
      }

      setStatus("success");
    } catch (err) {
      console.error("Contact error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Der skete en fejl. Prøv venligst igen.");
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="contact-form">
        <h2>Kontakt os</h2>

        {status === "success" ? (
          <div className="success-msg">
            Tak! Din besked er sendt.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Fulde navn</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                placeholder="Anders Jensen"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="anders@vvs.dk"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Besked</label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Hvordan kan vi hjælpe dig?"
              />
            </div>

            {status === "error" && (
              <div className="error-msg">{errorMessage}</div>
            )}

            <button type="submit" disabled={status === "loading"} className="submit-btn">
              {status === "loading" ? "Sender..." : "Send besked"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
