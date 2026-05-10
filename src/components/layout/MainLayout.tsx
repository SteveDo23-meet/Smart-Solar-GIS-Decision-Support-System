interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">{children}</div>;
};
