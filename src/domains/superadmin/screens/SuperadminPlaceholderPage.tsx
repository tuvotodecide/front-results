"use client";

import IntegrationPlaceholder from "../components/IntegrationPlaceholder";
import SuperadminPageHeader from "../components/SuperadminPageHeader";

interface SuperadminPlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
}

export default function SuperadminPlaceholderPage({
  title,
  subtitle,
  description,
}: SuperadminPlaceholderPageProps) {
  return (
    <section>
      <SuperadminPageHeader title={title} subtitle={subtitle} />
      <IntegrationPlaceholder
        title="Integración preparada"
        subtitle="Vista base disponible para completar con backend"
        description={description}
      />
    </section>
  );
}
