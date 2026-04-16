"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

const plans = [
  {
    tier: "Free",
    icon: "🆓",
    price: "Rp 0",
    period: "Forever free",
    features: [
      { text: "Access 1-2 free courses", enabled: true },
      { text: "Preview videos available", enabled: true },
      { text: "Community forum access", enabled: false },
      { text: "Certificate on completion", enabled: false },
      { text: "Premium voice SFX", enabled: false },
      { text: "Premium ebooks", enabled: false },
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    tier: "Basic",
    icon: "⭐",
    price: "Rp 99K",
    period: "/month",
    features: [
      { text: "Access selected courses", enabled: true },
      { text: "Stream in HD quality", enabled: true },
      { text: "Community forum access", enabled: true },
      { text: "Download 10 ebooks/mo", enabled: true },
      { text: "Certificate on completion", enabled: false },
      { text: "Premium voice SFX", enabled: false },
    ],
    cta: "Subscribe Basic",
    featured: false,
  },
  {
    tier: "Premium",
    icon: "💎",
    price: "Rp 199K",
    period: "/month",
    features: [
      { text: "Access ALL courses", enabled: true },
      { text: "Stream in HD quality", enabled: true },
      { text: "Community forum access", enabled: true },
      { text: "Unlimited ebook downloads", enabled: true },
      { text: "Certificate on completion", enabled: true },
      { text: "100+ Premium voice SFX", enabled: true },
    ],
    cta: "Subscribe Premium",
    featured: true,
  },
  {
    tier: "Lifetime",
    icon: "🏆",
    price: "Rp 1.499K",
    period: "one-time",
    features: [
      { text: "Everything in Premium", enabled: true },
      { text: "Lifetime access forever", enabled: true },
      { text: "Priority support", enabled: true },
      { text: "Early access to new content", enabled: true },
      { text: "Exclusive member badge", enabled: true },
      { text: "Future courses included", enabled: true },
    ],
    cta: "Get Lifetime Access",
    featured: false,
  },
];

const faqs = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept various Indonesian payment methods including bank transfer, e-wallets (GoPay, OVO, DANA), credit/debit cards, and mini-market payments through our payment gateway.",
  },
  {
    q: "Is there a refund policy?",
    a: "We offer a 7-day money-back guarantee for monthly subscriptions if you're not satisfied with the content. The Lifetime plan is eligible for a refund within 14 days of purchase.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Absolutely! You can change your plan at any time. When upgrading, you'll get prorated access. When downgrading, the change takes effect at your next billing cycle.",
  },
  {
    q: "Do I get a certificate for completing courses?",
    a: "Certificates are available for Premium and Lifetime members. After completing all videos and passing the final quiz with a minimum score, you'll receive a digital certificate with a unique verification code.",
  },
];

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className={styles.pricingContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Choose Your{" "}
          <span className="gradient-text">Learning Path</span>
        </h1>
        <p className={styles.subtitle}>
          Get unlimited access to premium courses, ebooks, and voice SFX. Start free or unlock everything.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className={styles.pricingGrid}>
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`${styles.card} ${plan.featured ? styles.cardFeatured : ""}`}
          >
            {plan.featured && <div className={styles.badge}>Most Popular</div>}
            <div className={styles.tierIcon}>{plan.icon}</div>
            <div className={styles.tierName}>{plan.tier}</div>
            <div
              className={`${styles.price} ${
                plan.tier === "Free" ? styles.priceFree : styles.priceGradient
              }`}
            >
              {plan.price}
            </div>
            <div className={styles.pricePeriod}>{plan.period}</div>

            <ul className={styles.featureList}>
              {plan.features.map((feat, i) => (
                <li
                  key={i}
                  className={`${styles.featureItem} ${feat.enabled ? styles.featureEnabled : ""}`}
                >
                  <span className={styles.featureIcon}>
                    {feat.enabled ? "✓" : "✗"}
                  </span>
                  <span>{feat.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.tier === "Free" ? "/register" : "/register"}
              className={`${styles.ctaBtn} ${
                plan.featured ? styles.ctaFilled : styles.ctaOutline
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <h2 className={styles.faqTitle}>
          Frequently Asked Questions
        </h2>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <div
              className={styles.faqQuestion}
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <span>{faq.q}</span>
              <span>{expandedFaq === index ? "−" : "+"}</span>
            </div>
            {expandedFaq === index && (
              <div className={styles.faqAnswer}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
