import { ReactNode } from "react";
import Navigation from "../common/Navigation";

interface Props {
  children: ReactNode;
}

const TTSLayout: React.FC<Props> = ({ children }) => {
  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">{children}</div>
      </section>
    </main>
  );
};

export default TTSLayout;
