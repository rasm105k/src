const demoUrl = process.env.NEXT_PUBLIC_WORKSLIP_DEMO_URL || "http://localhost:3001";

export default function DemoEmbed() {
  return (
    <section id="demo" className="demo-section">
      <div className="container demo-container">
        <div className="demo-copy">
          <span className="demo-kicker">Live demo</span>
          <h2>Prøv den digitale 4V05-arbejdsseddel direkte her</h2>
          <p>
            Workslip-demoen kører indlejret som app, så du hurtigt kan vise flowet fra
            rapportoplysninger til kontrolpunkter og digital attestering.
          </p>
          <div className="demo-actions">
            <a className="demo-primary" href={demoUrl} target="_blank" rel="noreferrer">
              Åbn demo i ny fane
            </a>
          </div>
        </div>

        <div className="demo-frame-shell" aria-label="Indlejret Workslip demo">
          <div className="demo-frame-toolbar">
            <span />
            <span />
            <span />
            <strong>Workslip PWA</strong>
          </div>
          <iframe
            title="Workslip digital 4V05 arbejdsseddel demo"
            src={demoUrl}
            loading="lazy"
            scrolling="no"
            className="demo-frame"
          />
        </div>
      </div>
    </section>
  );
}
