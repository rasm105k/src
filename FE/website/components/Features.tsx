import React from 'react';

const features = [
  {
    title: 'Digital 4V05-rapport',
    description: 'Udfyld, signer og arkiver dine 4V05-arbejdssedler direkte fra mobilen — ingen papirbøvl.',
    icon: '📄',
  },
  {
    title: 'Dokument-scanning',
    description: 'Scan papirsedler med telefonen og konverter dem automatisk til pæne PDF-rapporter.',
    icon: '📷',
  },
  {
    title: 'AI-assisteret',
    description: 'AI’en lytter med på opkald og laver referat, så du aldrig glemmer en aftale eller adgangskode.',
    icon: '🤖',
  },
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="features-header">
        <h2>Hvorfor Workslip?</h2>
        <p>Værktøjerne du skal bruge til at digitalisere 4V05-rapporteringen i dit VVS-firma.</p>
      </div>
      <div className="features-grid">
        {features.map((feature, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
