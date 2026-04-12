"use client";

import { Heart, Leaf, Globe, Award, Users, Sparkles } from "lucide-react";

export default function AboutPage() {

  const values = [
    { icon: Heart, title: "Quality First", desc: "Every piece is hand-selected and rigorously quality-checked before reaching you. We partner only with manufacturers who share our commitment to excellence." },
    { icon: Leaf, title: "Sustainable Fashion", desc: "We actively reduce our environmental footprint through eco-friendly packaging, carbon-neutral shipping options, and partnerships with ethical manufacturers." },
    { icon: Globe, title: "Global Reach", desc: "From Lisbon to Tokyo, we deliver worldwide. Our diverse collections celebrate fashion from every corner of the globe, curated for every body and every style." },
    { icon: Award, title: "Fair Pricing", desc: "We cut out the middlemen. By working directly with manufacturers, we offer premium fashion at honest prices — no inflated markups, no hidden costs." },
    { icon: Users, title: "Community Driven", desc: "Our customers shape our collections. We listen to feedback, run community polls, and constantly evolve based on what you love." },
    { icon: Sparkles, title: "Always Evolving", desc: "Fashion never stands still, and neither do we. New drops every week, trend forecasting, and seasonal collections that keep your wardrobe fresh." },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">About Lunark</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Born from a passion for accessible luxury, Lunark bridges the gap between high-end aesthetics and everyday affordability. We believe everyone deserves to feel confident in what they wear.
        </p>
      </div>

      {/* Our Story */}
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Founded in 2024 by a team of fashion enthusiasts who were tired of choosing between style and budget, Lunark started as a simple idea: what if premium fashion was truly accessible to everyone?
            </p>
            <p>
              What began as a small curated collection has grown into a global fashion destination. We source from the world&apos;s finest manufacturers, negotiate directly to eliminate unnecessary markups, and pass those savings on to you.
            </p>
            <p>
              Today, Lunark serves customers in over 50 countries, offering everything from everyday essentials to statement pieces — all with the quality and attention to detail you&apos;d expect from a luxury brand.
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              At Lunark, our mission is straightforward: make great style accessible without compromise. We refuse to believe that quality fashion must come with an unreasonable price tag.
            </p>
            <p>
              We&apos;re committed to ethical sourcing, sustainable practices, and transparent pricing. Every decision we make — from fabric selection to packaging — is guided by our responsibility to you and the planet.
            </p>
            <p>
              Our team works tirelessly to stay ahead of trends, ensuring our collections are always fresh, relevant, and inclusive. We design for real people, real bodies, and real lives.
            </p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Our Values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-lg border border-border/40 bg-card/50 p-8">
        {[
          { value: "50+", label: "Countries Served" },
          { value: "100K+", label: "Happy Customers" },
          { value: "5,000+", label: "Products" },
          { value: "4.8★", label: "Average Rating" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
