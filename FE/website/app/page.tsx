import Hero from '@/components/Hero';
import DemoEmbed from '@/components/DemoEmbed';
import DocumentScanDemo from '@/components/DocumentScanDemo';
import Features from '@/components/Features';
import ContactForm from '@/components/ContactForm';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Hero />
      <DemoEmbed />
      <DocumentScanDemo />
      <Features />
      <ContactForm />
    </main>
  );
}
