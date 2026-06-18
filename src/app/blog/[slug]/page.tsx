import BlogDetailClient from "./BlogDetailClient";

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  return <BlogDetailClient slug={params.slug} />;
} 