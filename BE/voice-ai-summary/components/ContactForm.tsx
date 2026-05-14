"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    const { error } = await supabase
      .from("leads")
      .insert([{ full_name: fullName, email, message }]);

    if (error) {
      console.error("Supabase error:", error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="contact-form">
        <h2>Contact Us</h2>

        {status === "success" ? (
          <div className="success-msg">
            Thank you! Your message has been sent successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="How can we help you?"
              />
            </div>

            {status === "error" && (
              <div className="error-msg">{errorMessage}</div>
            )}

            <button type="submit" disabled={status === "loading"} className="submit-btn">
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
