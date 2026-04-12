"use client";

import { Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const openPositions = [
  { title: "Senior Frontend Developer", dept: "Engineering", location: "Remote / Lisbon", type: "Full-time", desc: "Build and optimize our Next.js storefront, design system, and customer-facing features." },
  { title: "UX/UI Designer", dept: "Design", location: "Remote", type: "Full-time", desc: "Create intuitive, beautiful shopping experiences across web and mobile platforms." },
  { title: "Fashion Buyer", dept: "Merchandising", location: "Lisbon, Portugal", type: "Full-time", desc: "Source and curate collections from global manufacturers, negotiate pricing, and manage vendor relationships." },
  { title: "Digital Marketing Manager", dept: "Marketing", location: "Remote / Lisbon", type: "Full-time", desc: "Lead our growth strategy across social media, paid ads, SEO, and email campaigns." },
  { title: "Customer Support Specialist", dept: "Support", location: "Remote", type: "Full-time / Part-time", desc: "Provide exceptional support via chat, email, and phone. Help resolve orders, returns, and product inquiries." },
  { title: "Warehouse Operations Lead", dept: "Logistics", location: "Lisbon, Portugal", type: "Full-time", desc: "Oversee inventory management, order fulfillment, and shipping operations for our distribution center." },
];

export default function CareersPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Join Our Team</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We&apos;re building the future of accessible fashion. Join a passionate, diverse team where your work makes a real impact on how people dress and feel every day.
        </p>
      </div>

      {/* Why Lunark */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { title: "Remote-First", desc: "Work from anywhere. We have team members across 12 countries and counting." },
          { title: "Growth Culture", desc: "Annual learning budget, mentorship programs, and clear career progression paths." },
          { title: "Flexible Hours", desc: "We trust you to manage your time. Focus on results, not clock-watching." },
          { title: "Great Benefits", desc: "Health insurance, generous PTO, employee discounts, and team retreats twice a year." },
        ].map(({ title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Open Positions */}
      <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
      <div className="space-y-4">
        {openPositions.map((pos) => (
          <div key={pos.title} className="group rounded-lg border border-border/40 bg-card/50 p-6 transition-colors hover:border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{pos.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{pos.desc}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {pos.dept}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pos.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pos.type}</span>
                </div>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap self-start">
                Apply Now <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border/40 bg-card/50 p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Don&apos;t see a role for you?</h3>
        <p className="text-sm text-muted-foreground mb-4">We&apos;re always looking for exceptional talent. Send us your CV and tell us how you&apos;d contribute to Lunark.</p>
        <Link href="/contact" className="inline-flex items-center gap-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Get in Touch
        </Link>
      </div>
    </section>
  );
}
