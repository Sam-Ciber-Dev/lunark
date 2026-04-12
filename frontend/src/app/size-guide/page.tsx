"use client";

import { Ruler } from "lucide-react";

const womenSizes = [
  { size: "XS", eu: "32–34", uk: "4–6", us: "0–2", bust: "78–82", waist: "60–64", hips: "86–90" },
  { size: "S", eu: "36–38", uk: "8–10", us: "4–6", bust: "83–87", waist: "65–69", hips: "91–95" },
  { size: "M", eu: "40–42", uk: "12–14", us: "8–10", bust: "88–92", waist: "70–74", hips: "96–100" },
  { size: "L", eu: "44–46", uk: "16–18", us: "12–14", bust: "93–99", waist: "75–81", hips: "101–107" },
  { size: "XL", eu: "48–50", uk: "20–22", us: "16–18", bust: "100–108", waist: "82–90", hips: "108–116" },
];

const menSizes = [
  { size: "XS", eu: "44", uk: "34", us: "34", chest: "86–90", waist: "72–76", hips: "88–92" },
  { size: "S", eu: "46–48", uk: "36–38", us: "36–38", chest: "91–96", waist: "77–82", hips: "93–98" },
  { size: "M", eu: "50–52", uk: "40–42", us: "40–42", chest: "97–102", waist: "83–88", hips: "99–104" },
  { size: "L", eu: "54–56", uk: "44–46", us: "44–46", chest: "103–110", waist: "89–96", hips: "105–112" },
  { size: "XL", eu: "58–60", uk: "48–50", us: "48–50", chest: "111–120", waist: "97–106", hips: "113–122" },
];

const shoeWomen = [
  { eu: "35", uk: "2.5", us: "5", cm: "22.5" },
  { eu: "36", uk: "3.5", us: "6", cm: "23" },
  { eu: "37", uk: "4", us: "6.5", cm: "23.5" },
  { eu: "38", uk: "5", us: "7.5", cm: "24.5" },
  { eu: "39", uk: "6", us: "8.5", cm: "25" },
  { eu: "40", uk: "6.5", us: "9", cm: "25.5" },
  { eu: "41", uk: "7.5", us: "10", cm: "26.5" },
];

const shoeMen = [
  { eu: "39", uk: "5.5", us: "6.5", cm: "25" },
  { eu: "40", uk: "6.5", us: "7.5", cm: "25.5" },
  { eu: "41", uk: "7", us: "8", cm: "26" },
  { eu: "42", uk: "8", us: "9", cm: "27" },
  { eu: "43", uk: "9", us: "10", cm: "28" },
  { eu: "44", uk: "9.5", us: "10.5", cm: "28.5" },
  { eu: "45", uk: "10.5", us: "11.5", cm: "29" },
  { eu: "46", uk: "11.5", us: "12.5", cm: "30" },
];

export default function SizeGuidePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Size Guide</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find your perfect fit. All measurements are in centimetres (cm). When in doubt, size up for a more relaxed fit.
        </p>
      </div>

      {/* How to Measure */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Ruler className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-3">How to Measure</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p><strong className="text-foreground">Bust / Chest:</strong> Measure around the fullest part, keeping the tape level and snug but not tight.</p>
              </div>
              <div>
                <p><strong className="text-foreground">Waist:</strong> Measure around the narrowest part of your natural waist, usually just above the belly button.</p>
              </div>
              <div>
                <p><strong className="text-foreground">Hips:</strong> Stand with feet together and measure around the widest part of your hips and buttocks.</p>
              </div>
              <div>
                <p><strong className="text-foreground">Foot:</strong> Stand on a piece of paper, trace your foot, and measure from heel to longest toe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Women's Clothing */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Women&apos;s Clothing</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">EU</th>
                <th className="px-4 py-3 text-left font-semibold">UK</th>
                <th className="px-4 py-3 text-left font-semibold">US</th>
                <th className="px-4 py-3 text-left font-semibold">Bust (cm)</th>
                <th className="px-4 py-3 text-left font-semibold">Waist (cm)</th>
                <th className="px-4 py-3 text-left font-semibold">Hips (cm)</th>
              </tr>
            </thead>
            <tbody>
              {womenSizes.map((s) => (
                <tr key={s.size} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{s.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.eu}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.uk}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.us}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.bust}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.waist}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Men's Clothing */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Men&apos;s Clothing</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">EU</th>
                <th className="px-4 py-3 text-left font-semibold">UK</th>
                <th className="px-4 py-3 text-left font-semibold">US</th>
                <th className="px-4 py-3 text-left font-semibold">Chest (cm)</th>
                <th className="px-4 py-3 text-left font-semibold">Waist (cm)</th>
                <th className="px-4 py-3 text-left font-semibold">Hips (cm)</th>
              </tr>
            </thead>
            <tbody>
              {menSizes.map((s) => (
                <tr key={s.size} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{s.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.eu}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.uk}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.us}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.chest}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.waist}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Women's Shoes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Women&apos;s Shoes</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">EU</th>
                <th className="px-4 py-3 text-left font-semibold">UK</th>
                <th className="px-4 py-3 text-left font-semibold">US</th>
                <th className="px-4 py-3 text-left font-semibold">Foot Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {shoeWomen.map((s) => (
                <tr key={s.eu} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{s.eu}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.uk}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.us}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Men's Shoes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Men&apos;s Shoes</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">EU</th>
                <th className="px-4 py-3 text-left font-semibold">UK</th>
                <th className="px-4 py-3 text-left font-semibold">US</th>
                <th className="px-4 py-3 text-left font-semibold">Foot Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {shoeMen.map((s) => (
                <tr key={s.eu} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{s.eu}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.uk}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.us}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Sizing Tips</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• If you&apos;re between sizes, we recommend sizing up for a more comfortable fit.</li>
          <li>• Stretchy fabrics (jersey, knit) tend to be more forgiving — you can go with the smaller size.</li>
          <li>• For outerwear, consider going one size up if you plan to layer underneath.</li>
          <li>• Individual items may include specific sizing notes on the product page.</li>
          <li>• Still unsure? <a href="/contact" className="text-primary hover:underline">Contact us</a> and we&apos;ll help you find the right fit.</li>
        </ul>
      </div>
    </section>
  );
}
