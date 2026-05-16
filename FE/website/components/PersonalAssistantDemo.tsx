"use client";

import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  KeyRound,
  MapPin,
  MicOff,
  Phone,
  Play,
  ReceiptText,
  RotateCcw,
  Send,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const conversationBeats = [
  {
    speaker: "Kunde",
    text: "Hej, det er Louise fra Silkeborg. Vi har vand under køkkenvasken, og det bliver ved med at dryppe.",
    noteTitle: "Problem fanget",
    note: "Vand under køkkenvasken. Drypper fortsat, men er ikke akut.",
    type: "Opgave"
  },
  {
    speaker: "Ejer",
    text: "Okay, er det akut lige nu, eller kan vi kigge på det i morgen tidlig?",
    noteTitle: "Hastegrad afklaret",
    note: "Kan planlægges som almindeligt servicebesøg.",
    type: "Prioritet"
  },
  {
    speaker: "Kunde",
    text: "Det kan godt vente, hvis I kan komme torsdag morgen. Adressen er Nebel Skovdal 59.",
    noteTitle: "Adresse og vindue",
    note: "Nebel Skovdal 59, 8600 Silkeborg. Kunden ønsker torsdag morgen.",
    type: "Adresse"
  },
  {
    speaker: "Ejer",
    text: "Torsdag klokken 08:30 passer. Er der adgang, hvis du ikke er hjemme?",
    noteTitle: "Aftale fundet",
    note: "Servicebesøg torsdag kl. 08:30.",
    type: "Aftale"
  },
  {
    speaker: "Kunde",
    text: "Ja, der er nøgleboks ved bagdøren. Koden er 4281. Fakturaen skal sendes til boligforeningen.",
    noteTitle: "Adgang og faktura",
    note: "Nøgleboks ved bagdør, kode 4281. Faktura sendes til boligforening.",
    type: "Praktisk"
  },
  {
    speaker: "Ejer",
    text: "Perfekt, jeg sender Niels forbi torsdag 08:30 og noterer nøgleboksen og fakturaoplysningerne.",
    noteTitle: "Klar handling",
    note: "Opret servicebesøg til Niels og gem adgangsnote på opgaven.",
    type: "Næste skridt"
  }
];

const ownerBrief = [
  "Louise har vand under køkkenvasken. Det drypper fortsat, men kan vente til torsdag morgen.",
  "Besøg er aftalt torsdag kl. 08:30. Niels kan sendes forbi.",
  "Der er nøgleboks ved bagdøren, og fakturaen skal sendes til boligforeningen."
];

type DemoState = "idle" | "calling" | "done";

export default function PersonalAssistantDemo() {
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  useEffect(() => {
    if (demoState !== "calling") return;

    if (visibleLineCount >= conversationBeats.length) {
      const doneTimer = window.setTimeout(() => setDemoState("done"), 750);
      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setVisibleLineCount((count) => count + 1);
    }, visibleLineCount === 0 ? 450 : 1100);

    return () => window.clearTimeout(timer);
  }, [demoState, visibleLineCount]);

  const callTime = useMemo(() => {
    if (demoState === "idle") return "00:00";
    const seconds = Math.min(38, visibleLineCount * 6 + (demoState === "done" ? 4 : 0));
    return `00:${String(seconds).padStart(2, "0")}`;
  }, [demoState, visibleLineCount]);

  function startDemo() {
    setVisibleLineCount(0);
    setDemoState("calling");
  }

  function resetDemo() {
    setVisibleLineCount(0);
    setDemoState("idle");
  }

  const visibleBeats = conversationBeats.slice(0, visibleLineCount);
  const latestBeat = visibleBeats.at(-1);
  const isRunning = demoState === "calling";
  const isDone = demoState === "done";

  return (
    <section id="assistant-demo" className="assistant-demo-section">
      <div className="container">
        <div className="assistant-demo-heading">
          <span className="demo-kicker">AI personal assistant</span>
          <h2>AI’en lytter med på opkaldet og sender ejeren et brugbart referat.</h2>
          <p>
            Ejeren taler stadig selv med kunden. Assistenten er kun referent i baggrunden:
            den fanger aftaler, adgangsinfo og næste handling, så intet bliver glemt efter
            opkaldet.
          </p>
        </div>

        <div className="assistant-demo-grid">
          <div className="call-card">
            <div className="call-card-header">
              <div>
                <span>Live opkald</span>
                <strong>Kunde ↔ Ejer</strong>
              </div>
              <div className={`assistant-listener ${isRunning ? "active" : ""}`}>
                <Headphones size={16} strokeWidth={2.4} />
                <span>AI lytter kun</span>
              </div>
            </div>

            <div className="phone-surface" aria-label="Simuleret iPhone-opkald">
              <div className="iphone-status">
                <span>09:41</span>
                <div className="iphone-status-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="call-island">
                <span />
                <strong>MedPåEnLytter aktiv</strong>
              </div>

              <div className="phone-contact">
                <div className="contact-avatar">LH</div>
                <span>{isRunning || isDone ? "Mobilopkald" : "Indgående opkald"}</span>
                <strong>Louise Hansen</strong>
                <small>{isRunning || isDone ? callTime : "Vand under køkkenvask"}</small>
              </div>

              <div className="iphone-live-caption">
                <span>Seneste sætning</span>
                <p>
                  {latestBeat
                    ? `${latestBeat.speaker}: ${latestBeat.text}`
                    : "AI’en står klar i baggrunden og tager noter, når opkaldet starter."}
                </p>
              </div>

              <div className="iphone-call-actions">
                <span className="call-action">
                  <MicOff size={19} strokeWidth={2.4} />
                  <b>Mute</b>
                </span>
                <span className="call-action active">
                  <Headphones size={19} strokeWidth={2.4} />
                  <b>AI lytter</b>
                </span>
                <span className="call-action">
                  <Sparkles size={19} strokeWidth={2.4} />
                  <b>Noter</b>
                </span>
              </div>

              <div className="iphone-end-call">
                <span>
                  <Phone size={18} strokeWidth={2.5} />
                </span>
              </div>
            </div>

            <button
              className="assistant-demo-button"
              type="button"
              onClick={isDone ? resetDemo : startDemo}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Sparkles size={18} strokeWidth={2.5} />
                  Opkald i gang...
                </>
              ) : isDone ? (
                <>
                  <RotateCcw size={18} strokeWidth={2.5} />
                  Afspil igen
                </>
              ) : (
                <>
                  <Play size={18} strokeWidth={2.5} />
                  Start demo-opkald
                </>
              )}
            </button>
          </div>

          <div className="transcript-card">
            <div className="transcript-header">
              <div>
                <span>Noter dannes</span>
                <strong>Assistant-noter</strong>
              </div>
              <b>{visibleLineCount}/{conversationBeats.length}</b>
            </div>

            <div className="assistant-note-feed" aria-live="polite">
              {visibleBeats.length === 0 ? (
                <div className="transcript-empty">
                  <Sparkles size={22} strokeWidth={2.4} />
                  <span>Start demoen for at se AI’en bygge korte arbejdsnoter i baggrunden.</span>
                </div>
              ) : (
                visibleBeats.map((beat, index) => (
                  <div className="assistant-note" key={`${beat.noteTitle}-${index}`}>
                    <div className="note-marker">
                      <Sparkles size={15} strokeWidth={2.6} />
                    </div>
                    <div>
                      <span>{beat.type}</span>
                      <strong>{beat.noteTitle}</strong>
                      <p>{beat.note}</p>
                      <small>Fanget fra: {beat.speaker}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <article className={`owner-message-card ${isDone ? "ready" : ""}`}>
            <div className="owner-message-header">
              <div>
                <span>Efter opkald</span>
                <h3>Besked til ejer</h3>
              </div>
              <Send size={24} strokeWidth={2.3} />
            </div>

            {isDone ? (
              <>
                <section className="owner-summary">
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                  <p>Opkaldet er færdigt. AI’en har lavet en kort ejerbesked og forberedt kalenderforslaget.</p>
                </section>

                <div className="owner-brief">
                  {ownerBrief.map((item) => (
                    <div key={item}>
                      <CheckCircle2 size={17} strokeWidth={2.5} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>

                <div className="calendar-booking-card">
                  <div className="calendar-booking-top">
                    <div className="google-calendar-mark" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <span>Google Calendar</span>
                    <b>Foreslået booking</b>
                  </div>

                  <div className="calendar-booking-main">
                    <CalendarCheck size={22} strokeWidth={2.5} />
                    <div>
                      <strong>Servicebesøg hos Louise</strong>
                      <p>Torsdag 08:30-09:30</p>
                    </div>
                  </div>

                  <div className="calendar-booking-details">
                    <div>
                      <MapPin size={16} strokeWidth={2.5} />
                      <span>Nebel Skovdal 59, 8600 Silkeborg</span>
                    </div>
                    <div>
                      <KeyRound size={16} strokeWidth={2.5} />
                      <span>Nøgleboks ved bagdør, kode 4281</span>
                    </div>
                    <div>
                      <ReceiptText size={16} strokeWidth={2.5} />
                      <span>Faktura sendes til boligforeningen</span>
                    </div>
                  </div>
                </div>

                <div className="owner-next-action">
                  <Clock3 size={18} strokeWidth={2.5} />
                  <span>Klar opgave til ejer</span>
                  <strong>Book servicebesøg torsdag 08:30</strong>
                </div>
              </>
            ) : (
              <div className="owner-message-placeholder">
                <Sparkles size={28} strokeWidth={2.3} />
                <strong>Resume vises efter opkaldet</strong>
                <span>AI’en sender først beskeden, når samtalen er afsluttet.</span>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
