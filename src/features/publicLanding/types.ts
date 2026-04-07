export interface LandingHero {
  title: {
    prefix: string;
    highlight: string;
  };
  subtitle: string;
  ctaText: string;
  videoEmbedUrl: string;
}

export type ElectionStatus = 'ACTIVA' | 'FINALIZADA' | 'PROXIMA';

export interface ActiveElection {
  id: string;
  title: string;
  organization: string;
  status: ElectionStatus;
  closesIn?: string;
  votingSchedule?: {
    from: string;
    to: string;
  };
  isFeatured: boolean;
}

export interface BenefitCard {
  id: string;
  title: string;
  description: string;
  icon:
    | "desktop"
    | "users"
    | "file-search"
    | "shield"
    | "id"
    | "check"
    | "mobile";
}

export interface BenefitAudience {
  id: "organizers" | "voters";
  label: string;
  cards: BenefitCard[];
}

export interface BenefitsSectionData {
  title: string;
  audiences: BenefitAudience[];
}

export interface TrustBrand {
  id: string;
  name: string;
  accent?: string;
  logoSrc?: string;
  logoAlt?: string;
}

export interface TrustSectionData {
  title: string;
  institutionsLabel: string;
  institutionsValue: string;
  electionsLabel: string;
  electionsValue: string;
  trustedTitle: string;
  trustedSubtitle: string;
  brands: TrustBrand[];
}

export interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: "user-plus" | "settings" | "users" | "pulse" | "mobile";
}

export interface FinalCtaCard {
  title: string;
  description: string;
  icon: "institution" | "mobile";
  buttonText: string;
  buttonHref: string;
  buttonSubtext?: string;
  dark?: boolean;
}

export interface ContactInfo {
  whatsappNumber: string;
  email: string;
  attentionHours: string;
  brandName: string;
  socialLinks: Array<{
    id: string;
    href: string;
    label: string;
    icon: "facebook" | "twitter" | "instagram" | "linkedin";
  }>;
}

export interface PublicLandingData {
  hero: LandingHero;
  benefits: BenefitsSectionData;
  trust: TrustSectionData;
  howItWorks: {
    title: string;
    steps: Step[];
  };
  finalCta: {
    institutions: FinalCtaCard;
    voters: FinalCtaCard;
  };
  contact: ContactInfo;
}
