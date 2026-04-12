"use client";

import { Star, Gift, TrendingUp, Award, ShoppingBag } from "lucide-react";

const tiers = [
  { name: "Bronze", points: "0 – 499", perks: ["1 point per €1 spent", "Birthday bonus (50 pts)", "Early access to sales"], color: "from-amber-700 to-amber-900" },
  { name: "Silver", points: "500 – 1,999", perks: ["1.5 points per €1 spent", "Birthday bonus (100 pts)", "Free standard shipping", "Exclusive member offers"], color: "from-gray-400 to-gray-500" },
  { name: "Gold", points: "2,000 – 4,999", perks: ["2 points per €1 spent", "Birthday bonus (200 pts)", "Free express shipping", "Priority customer support", "Early access to new drops"], color: "from-yellow-500 to-amber-600" },
  { name: "Platinum", points: "5,000+", perks: ["3 points per €1 spent", "Birthday bonus (500 pts)", "Free next-day shipping", "VIP customer support", "Exclusive collections access", "Annual gift box"], color: "from-purple-500 to-indigo-600" },
];

const rewards = [
  { points: 100, reward: "€5 discount" },
  { points: 200, reward: "€10 discount" },
  { points: 500, reward: "€30 discount" },
  { points: 1000, reward: "€75 discount" },
  { points: 2000, reward: "€175 discount" },
];

export default function BonusPointsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Bonus Points</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get rewarded every time you shop. Earn points, unlock exclusive perks, and redeem discounts across our store.
        </p>
      </div>

      {/* How It Works */}
      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        {[
          { icon: ShoppingBag, title: "Shop & Earn", desc: "Earn points on every purchase. The more you shop, the more you earn." },
          { icon: TrendingUp, title: "Level Up", desc: "Reach higher tiers for better earning rates and exclusive perks." },
          { icon: Gift, title: "Redeem Rewards", desc: "Use your points for discounts, free shipping, and exclusive offers." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <h2 className="text-2xl font-bold mb-6 text-center">Membership Tiers</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {tiers.map(({ name, points, perks, color }) => (
          <div key={name} className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
            <div className={`bg-gradient-to-br ${color} px-4 py-4`}>
              <Award className="h-6 w-6 text-white/80 mb-1" />
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-xs text-white/70">{points} points</p>
            </div>
            <div className="p-4">
              <ul className="space-y-2 text-xs text-muted-foreground">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Star className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Redemption Table */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Redeem Your Points</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Points</th>
                <th className="px-6 py-3 text-left font-semibold">Reward</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map(({ points, reward }) => (
                <tr key={points} className="border-t border-border/40">
                  <td className="px-6 py-3 font-medium">{points.toLocaleString()} pts</td>
                  <td className="px-6 py-3 text-muted-foreground">{reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ways to Earn */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-xl font-bold mb-4">Ways to Earn Points</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          {[
            { action: "Make a purchase", reward: "1–3 pts per €1 (tier-based)" },
            { action: "Create an account", reward: "50 points welcome bonus" },
            { action: "Write a product review", reward: "25 points per review" },
            { action: "Refer a friend", reward: "100 points when they make a purchase" },
            { action: "Birthday", reward: "50–500 points (tier-based)" },
            { action: "Follow us on social media", reward: "10 points per platform" },
          ].map(({ action, reward }) => (
            <div key={action} className="flex justify-between items-center rounded-md border border-border/30 p-3">
              <span className="font-medium text-foreground">{action}</span>
              <span className="text-xs">{reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">Do points expire?</p>
            <p className="text-muted-foreground">Points expire 12 months after they were earned if there is no account activity (purchase or redemption) during that period.</p>
          </div>
          <div>
            <p className="font-semibold">Can I use points and a discount code together?</p>
            <p className="text-muted-foreground">Yes! You can combine points redemption with a promotional discount code on the same order.</p>
          </div>
          <div>
            <p className="font-semibold">What happens to my points if I return an item?</p>
            <p className="text-muted-foreground">Points earned from a returned item will be deducted from your balance once the return is processed.</p>
          </div>
          <div>
            <p className="font-semibold">How do I check my points balance?</p>
            <p className="text-muted-foreground">Log into your account and visit your profile page. Your current points balance and tier status are displayed at the top.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
