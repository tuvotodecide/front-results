import React from 'react';
import { Link } from 'react-router-dom';
import tuvotoDecideImage from '../../../assets/tuvotodecide.webp';
import type { ContactInfo, FinalCtaCard } from '../types';

interface ContactSectionProps {
  cards: {
    institutions: FinalCtaCard;
    voters: FinalCtaCard;
  };
  contact: ContactInfo;
}

const CardIcon: React.FC<{ type: FinalCtaCard['icon'] }> = ({ type }) => {
  const className = 'w-8 h-8';

  if (type === 'mobile') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18h2" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="4" width="10" height="16" rx="2" />
      <path d="M9 8h2" />
      <path d="M9 12h2" />
      <path d="M9 16h2" />
      <path d="M17 7h2a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2h-3" />
    </svg>
  );
};

const SocialIcon: React.FC<{ type: ContactInfo['socialLinks'][number]['icon'] }> = ({ type }) => {
  const className = 'w-5 h-5';

  const icons = {
    facebook: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7.86v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
      </svg>
    ),
    instagram: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  };

  return icons[type];
};

const AppStoreButton: React.FC<{ href: string; dark?: boolean; text: string; subtext?: string }> = ({
  href,
  dark,
  text,
  subtext,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={[
      'inline-flex min-h-[82px] w-full max-w-[360px] items-center justify-center gap-4 rounded-[18px] px-6 py-4 font-bold shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition',
      dark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-emerald-500 text-white hover:bg-emerald-600',
    ].join(' ')}
  >
    <div className="h-0 w-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-emerald-500" />
    <div className="text-left leading-tight">
      {subtext && <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{subtext}</div>}
      <div className="text-2xl">{text}</div>
    </div>
  </a>
);

const CtaCard: React.FC<{ card: FinalCtaCard }> = ({ card }) => {
  const contentClassName = card.dark ? 'bg-[#003b2f] text-white' : 'bg-slate-50 text-slate-950';
  const iconClassName = card.dark
    ? 'border border-emerald-600 bg-emerald-500/10 text-emerald-400'
    : 'bg-emerald-50 text-emerald-600';

  return (
    <article className={`rounded-[34px] border border-slate-200 px-8 py-10 shadow-[0_14px_32px_rgba(15,23,42,0.1)] ${contentClassName}`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${iconClassName}`}>
        <CardIcon type={card.icon} />
      </div>
      <h3 className="mt-8 text-center text-4xl font-bold leading-tight">
        {card.title}
      </h3>
      <p className={`mx-auto mt-6 max-w-md text-center text-xl leading-9 ${card.dark ? 'text-emerald-50/85' : 'text-slate-600'}`}>
        {card.description}
      </p>
      <div className="mt-10 flex justify-center">
        {card.buttonSubtext ? (
          <AppStoreButton
            href={card.buttonHref}
            dark={card.dark}
            text={card.buttonText}
            subtext={card.buttonSubtext}
          />
        ) : (
          <Link
            to={card.buttonHref}
            className="inline-flex min-w-[240px] items-center justify-center rounded-[18px] bg-emerald-500 px-8 py-5 text-2xl font-bold text-white shadow-[0_12px_28px_rgba(34,197,94,0.32)] transition hover:bg-emerald-600"
          >
            {card.buttonText}
          </Link>
        )}
      </div>
    </article>
  );
};

const ContactSection: React.FC<ContactSectionProps> = ({ cards, contact }) => {
  const whatsappHref = `https://wa.me/591${contact.whatsappNumber}`;

  return (
    <>
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <CtaCard card={cards.institutions} />
            <CtaCard card={cards.voters} />
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-10 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <img
                  src={tuvotoDecideImage}
                  alt={contact.brandName}
                  className="h-12 w-12 rounded-xl object-cover shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
                />
                <span className="text-3xl font-bold text-white">{contact.brandName}</span>
              </div>
              <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-3 text-lg text-slate-300 transition hover:text-white md:justify-start">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {contact.email}
              </a>
            </div>

            <p className="text-base text-slate-400 md:text-center">
              © {new Date().getFullYear()} {contact.brandName}. Todos los derechos reservados.
            </p>

            <div className="flex items-center justify-center gap-3">
              {contact.socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                >
                  <SocialIcon type={social.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_34px_rgba(37,211,102,0.4)] transition hover:bg-[#20BD5A]"
      >
        <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  );
};

export default ContactSection;
