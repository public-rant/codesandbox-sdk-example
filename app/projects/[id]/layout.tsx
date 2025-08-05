import { SandboxProvider } from '../../contexts/SandboxContext';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SandboxProvider>
      {children}
    </SandboxProvider>
  );
}