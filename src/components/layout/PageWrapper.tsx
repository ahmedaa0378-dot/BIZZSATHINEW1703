export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-surface-light dark:bg-surface-dark lg:border-x lg:border-neutral-200 lg:dark:border-white/5 lg:shadow-2xl">
      {children}
    </div>
  );
}