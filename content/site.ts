import { contact } from "@/content/contact";

export const SITE_URL = "https://iffykhan.ae";

export const site = {
  name: "Iffy Khan",
  role: "Property Advisory",
  region: "Dubai & Abu Dhabi",
  ...contact,
  instagram: "https://instagram.com/iffy_realestate",
  instagramHandle: "@iffy_realestate",
  office: "Office 104, Building 4, Dubai Hills Business Park, Dubai, UAE",
  mapUrl: "https://maps.app.goo.gl/C8X2wJoAyDFFxAFm6",
  licence: "91889",
  agency: "Kamani Living",
  orn: "1247700",
  designerUrl: "https://www.localfoundary.co.uk",
  disclaimer:
    "Information on this site is for guidance only and is not financial advice. No returns are guaranteed.",
} as const;

export const navigation = [
  { label: "Buying", href: "/?intent=buying#buying" },
  { label: "Selling", href: "/?intent=selling#selling" },
  { label: "Areas", href: "/areas" },
  { label: "Tools", href: "/#tools" },
  { label: "About", href: "/about" },
  { label: "Reviews", href: "/#testimonials" },
] as const;

export const testimonials = [
  {
    quote:
      "We worked with Iffy Khan to secure our property in Dubai, and the experience was exceptional. Iffy took the time to ask thoughtful questions to understand us better and guided us through the entire process from start to finish, making it much easier for us to make a confident decision.",
    attribution: "Ola A, Buyers, Dubai",
  },
  {
    quote:
      "I would highly recommend Iffy Khan when it comes to finding a place to call home in Dubai. He really cared and wanted us to make the decision that was best for us. I never felt any stress or pressure to make a decision and he made the process seamless.",
    featuredExcerpt:
      "He really cared and wanted us to make the decision that was best for us. I never felt any stress or pressure to make a decision and he made the process seamless.",
    attribution: "Oisin W, Home Buyer, Dubai",
  },
  {
    quote:
      "As a first-time homebuyer, I honestly didn't know what to expect, but Iffy was absolutely incredible from start to finish. He took the time to explain every step of the process in a way that was clear, patient, and easy to understand. I never felt rushed or pressured, just guided and informed.",
    attribution: "Kaia W, First-Time Buyer, Dubai",
  },
  {
    quote:
      "I had an outstanding experience working with Iffy Khan securing my first investment in Dubai. His market insight, attention to detail and genuine dedication made me feel confident in my purchase. I couldn't have asked for a better advisor.",
    attribution: "Emma J, First-Time Investor, Dubai",
  },
] as const;

export const realEstateAgentSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: site.name,
  url: `${SITE_URL}/`,
  telephone: site.phoneE164,
  email: site.email,
  worksFor: { "@type": "Organization", name: site.agency },
  areaServed: ["Dubai", "Abu Dhabi"],
} as const;
