"use client";

import { Leaf, Recycle, Droplets, Wind, Package, Heart } from "lucide-react";

export default function SustainabilityPage() {
  const pillars = [
    { icon: Leaf, title: "Ethical Sourcing", desc: "We partner with factories that provide fair wages, safe working conditions, and respect workers' rights. Every supplier is audited annually against international labor standards." },
    { icon: Recycle, title: "Circular Fashion", desc: "Our garment recycling program lets you return worn Lunark items. We repurpose, recycle, or upcycle them — keeping textiles out of landfills and giving materials a second life." },
    { icon: Droplets, title: "Water Conservation", desc: "Our manufacturing partners use water-saving dyeing techniques that reduce water consumption by up to 50% compared to conventional methods." },
    { icon: Wind, title: "Carbon Neutral Shipping", desc: "We offset 100% of our shipping emissions through verified carbon credit programs. We also optimize packaging to reduce waste and shipment weight." },
    { icon: Package, title: "Eco-Friendly Packaging", desc: "All our packaging is made from recycled materials and is fully recyclable. We've eliminated single-use plastics from our entire supply chain." },
    { icon: Heart, title: "Community Impact", desc: "1% of every purchase goes to environmental and social causes through our Lunark Gives Back program. We support reforestation, ocean cleanup, and education initiatives." },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Sustainability</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Fashion should look good and do good. We&apos;re committed to reducing our environmental impact at every step — from sourcing to shipping to the end of a garment&apos;s life.
        </p>
      </div>

      {/* Goals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-lg border border-border/40 bg-card/50 p-8 mb-16">
        {[
          { value: "50%", label: "Sustainable materials by 2027" },
          { value: "100%", label: "Carbon neutral shipping" },
          { value: "Zero", label: "Single-use plastic in packaging" },
          { value: "1%", label: "Revenue to social causes" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Pillars */}
      <h2 className="text-2xl font-bold text-center mb-10">Our Sustainability Pillars</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {pillars.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Roadmap</h2>
        <div className="space-y-6">
          {[
            { year: "2024", milestone: "Launched eco-friendly packaging across all orders. Eliminated plastic poly bags." },
            { year: "2025", milestone: "Achieved carbon-neutral shipping. Introduced garment recycling pilot program." },
            { year: "2026", milestone: "30% of products made with sustainable or recycled materials. Expanded recycling program worldwide." },
            { year: "2027", milestone: "Target: 50% sustainable materials. Full supply chain transparency report." },
            { year: "2030", milestone: "Target: 80% sustainable materials. Net-zero operations across all facilities." },
          ].map(({ year, milestone }) => (
            <div key={year} className="flex gap-4">
              <span className="text-primary font-bold text-sm w-12 shrink-0 pt-0.5">{year}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{milestone}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
