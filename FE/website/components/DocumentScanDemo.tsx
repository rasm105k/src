"use client";

import { CheckCircle2, FileText, Loader2, ScanLine, Sparkles } from "lucide-react";
import { useState } from "react";

const extractedFields = [
  ["Rapportnummer", "1742"],
  ["Kunde", "Klimahuse"],
  ["Adresse", "Nebel Skovdal 59, Silkeborg"],
  ["Kontakt", "Ikke angivet på papir"],
  ["Arbejde", "Koldtvand, varmtvand og gulvvarme"],
  ["Montør", "Niels Petersen · NP Teknik ApS"],
];

const checks = [
  "Forundersøgelse udført",
  "Modtagekontrol dokumenteret",
  "Udførelseskontrol valgt efter anlægstype",
  "Slutkontrol uden afvigelser",
];

export default function DocumentScanDemo() {
  const [conversionState, setConversionState] = useState<"source" | "converting" | "report">("source");

  function convertDocument() {
    setConversionState("converting");
    window.setTimeout(() => setConversionState("report"), 1100);
  }

  const isConverted = conversionState === "report";
  const isConverting = conversionState === "converting";

  return (
    <section id="scan" className="scan-demo-section">
      <div className="container">
        <div className="scan-demo-heading">
          <span className="demo-kicker">Dokument-scanning</span>
          <h2>Vis først papirsedlen. Konverter den derefter til en pæn PDF-rapport.</h2>
          <p>
            Demoen bruger en udfyldt arbejdsseddel som udgangspunkt, så kunden kan se
            før/efter-flowet uden rigtig OCR eller backend.
          </p>
        </div>

        <div className="scan-demo-container">
          <div className="scan-panel">
            <div className="scan-panel-header">
              <div>
                <span>Originalt dokument</span>
                <strong>arbejdsseddel-udfyldt.pdf</strong>
              </div>
              <a href="/demo/arbejdsseddel-udfyldt.pdf" target="_blank" rel="noreferrer">
                Åbn PDF
              </a>
            </div>

            <div className={`source-document ${isConverting ? "converting" : ""}`}>
              <img
                src="/demo/arbejdsseddel-udfyldt.png"
                alt="Preview af udfyldt arbejdsseddel"
              />
              <div className="scan-light" />
            </div>

            <button
              className="convert-button"
              type="button"
              onClick={convertDocument}
              disabled={isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 size={19} strokeWidth={2.5} />
                  Konverterer dokument...
                </>
              ) : (
                <>
                  <ScanLine size={19} strokeWidth={2.5} />
                  Konverter digitalt
                </>
              )}
            </button>
          </div>

          {isConverted ? (
            <article className="report-preview pdf-report" aria-label="Digital PDF rapport">
              <header className="report-preview-header">
                <div>
                  <span>PDF-rapport</span>
                  <h3>Q-kontrol dokumentation</h3>
                </div>
                <FileText size={28} strokeWidth={2.3} />
              </header>

              <section className="report-status">
                <Sparkles size={18} strokeWidth={2.4} />
                <span>Automatisk genereret fra scannet arbejdsseddel</span>
              </section>

              <div className="report-fields">
                {extractedFields.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <section className="report-section-block">
                <span>Opgavebeskrivelse</span>
                <p>
                  Installation markeret som vandinstallation og varmeinstallation. Arbejdet
                  omfatter koldtvand, varmtvand og gulvvarme med relevante 4V05-kontrolpunkter
                  digitaliseret fra den indscannede arbejdsseddel.
                </p>
              </section>

              <section className="report-section-block">
                <span>Kontrolpunkter</span>
                <div className="report-checks">
                  {checks.map((check) => (
                    <div key={check}>
                      <CheckCircle2 size={17} strokeWidth={2.6} />
                      <strong>{check}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="report-audit">
                <span>Digital attestering</span>
                <strong>MitID Erhverv · Niels Petersen · 16.05.2026 09:42</strong>
              </footer>
            </article>
          ) : (
            <aside className="report-placeholder">
              <FileText size={34} strokeWidth={2.2} />
              <strong>Digital rapport vises her</strong>
              <span>Tryk på “Konverter digitalt” for at lave papirsedlen om til en pæn PDF-rapport.</span>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
