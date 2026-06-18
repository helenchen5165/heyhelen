import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design Playground - HeyHelen',
  description: '前端设计能力展示 - A comprehensive showcase of modern frontend design capabilities',
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
