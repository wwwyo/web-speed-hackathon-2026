import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";

interface Props {
  title: string;
  headline: string;
  description?: string;
}

export const RouteLoadingPage = ({ title, headline, description }: Props) => {
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <section aria-busy="true" className="min-h-full" data-testid="route-loading">
        <header className="border-cax-border flex flex-col gap-3 border-b px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold">{headline}</h1>
          {description != null ? (
            <p className="text-cax-text-muted text-sm">{description}</p>
          ) : null}
        </header>
        <div className="space-y-4 px-4 py-6">
          <div className="bg-cax-surface-subtle h-4 w-2/3 rounded-full" />
          <div className="bg-cax-surface-subtle h-24 rounded-2xl" />
          <div className="bg-cax-surface-subtle h-4 w-5/6 rounded-full" />
          <div className="bg-cax-surface-subtle h-4 w-1/2 rounded-full" />
        </div>
      </section>
    </>
  );
};
