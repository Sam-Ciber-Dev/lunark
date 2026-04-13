"use client";

import { Star, Gift, TrendingUp, Award, ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const rewards = [
  { points: 100, reward: "redeem100" },
  { points: 200, reward: "redeem250" },
  { points: 500, reward: "redeem500" },
  { points: 1000, reward: "redeem1000" },
];

export default function BonusPointsPage() {
  const { t } = useI18n();

  const tiers = [
    { name: t.bonusPage.bronze, points: t.bonusPage.bronzeReq, perks: t.bonusPage.bronzePerks.split(";"), color: "from-amber-700 to-amber-900" },
    { name: t.bonusPage.silver, points: t.bonusPage.silverReq, perks: t.bonusPage.silverPerks.split(";"), color: "from-gray-400 to-gray-500" },
    { name: t.bonusPage.gold, points: t.bonusPage.goldReq, perks: t.bonusPage.goldPerks.split(";"), color: "from-yellow-500 to-amber-600" },
    { name: t.bonusPage.platinum, points: t.bonusPage.platinumReq, perks: t.bonusPage.platinumPerks.split(";"), color: "from-purple-500 to-indigo-600" },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t.bonusPage.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.bonusPage.subtitle}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        {[
          { icon: ShoppingBag, title: t.bonusPage.shopEarn, desc: t.bonusPage.shopEarnDesc },
          { icon: TrendingUp, title: t.bonusPage.levelUp, desc: t.bonusPage.levelUpDesc },
          { icon: Gift, title: t.bonusPage.redeemRewards, desc: t.bonusPage.redeemRewardsDesc },
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
      <h2 className="text-2xl font-bold mb-6 text-center">{t.bonusPage.tiersTitle}</h2>
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

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">{t.bonusPage.redeemTitle}</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">{t.bonusPage.points}</th>
                <th className="px-6 py-3 text-left font-semibold">{t.bonusPage.reward}</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map(({ points, reward }) => (
                <tr key={points} className="border-t border-border/40">
                  <td className="px-6 py-3 font-medium">{points.toLocaleString()} pts</td>
                  <td className="px-6 py-3 text-muted-foreground">{(t.bonusPage as Record<string, string>)[reward]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8 mb-12">
        <h2 className="text-xl font-bold mb-4">{t.bonusPage.waysTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          {[
            { action: t.bonusPage.wayPurchase, reward: t.bonusPage.wayPurchaseReward },
            { action: t.bonusPage.wayAccount, reward: t.bonusPage.wayAccountReward },
            { action: t.bonusPage.wayReview, reward: t.bonusPage.wayReviewReward },
            { action: t.bonusPage.wayRefer, reward: t.bonusPage.wayReferReward },
            { action: t.bonusPage.wayBirthday, reward: t.bonusPage.wayBirthdayReward },
            { action: t.bonusPage.waySocial, reward: t.bonusPage.waySocialReward },
          ].map(({ action, reward }) => (
            <div key={action} className="flex justify-between items-center rounded-md border border-border/30 p-3">
              <span className="font-medium text-foreground">{action}</span>
              <span className="text-xs">{reward}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <h2 className="text-xl font-bold mb-4">{t.bonusPage.faqTitle}</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">{t.bonusPage.faqExpire}</p>
            <p className="text-muted-foreground">{t.bonusPage.faqExpireA}</p>
          </div>
          <div>
            <p className="font-semibold">{t.bonusPage.faqCombine}</p>
            <p className="text-muted-foreground">{t.bonusPage.faqCombineA}</p>
          </div>
          <div>
            <p className="font-semibold">{t.bonusPage.faqReturn}</p>
            <p className="text-muted-foreground">{t.bonusPage.faqReturnA}</p>
          </div>
          <div>
            <p className="font-semibold">{t.bonusPage.faqBalance}</p>
            <p className="text-muted-foreground">{t.bonusPage.faqBalanceA}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
