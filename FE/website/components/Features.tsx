import React from 'react';

const features = [
  {
    title: 'Fast Integration',
    description: 'Get up and running in minutes with our simple API and intuitive dashboard.',
    icon: '⚡',
  },
  {
    title: 'Real-time Analytics',
    description: 'Track your conversions and lead quality with deep-dive real-time insights.',
    icon: '📈',
  },
  {
    title: 'Secure by Design',
    description: 'Enterprise-grade security ensuring your customer data is always protected.',
    icon: '🛡️',
  },
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="features-header">
        <h2>Why Choose Our Platform?</h2>
        <p>We provide the tools you need to turn visitors into lifelong customers.</p>
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
