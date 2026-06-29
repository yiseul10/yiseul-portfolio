import { notFound } from 'next/navigation'
import { CustomMDX } from 'app/components/mdx'
import { baseUrl } from 'app/sitemap'
import { supabase } from "@lib/superbase";
import type { Metadata } from 'next'
import {formatDate} from "@/app/blog/utils/post.server";
import {PostActions} from "@/app/blog/[slug]/components/PostActions";
import {PostGuard} from "@/app/blog/[slug]/components/PostGuard";
import { createServerSupabase } from '@lib/supabase-server'
import { getAdminSession } from '@lib/auth/admin'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true)

  return posts?.filter(post => post.slug !== 'supplier_system')
      .map((post) => ({
        slug: post.slug,
      })) ?? []
}

export async function generateMetadata({ params }): Promise<Metadata | undefined> {
    const { data: post } = await supabase
        .from('posts')
        .select('title, description, image, created_at, slug, published')
        .eq('slug', params.slug)
        .eq('published', true)
        .single()

    if (!post) return undefined

  const {
    title,
    description,
    image,
    created_at: publishedTime,
    slug,
  } = post

  const ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Blog({ params }) {
    const serverSupabase = await createServerSupabase()
    const adminSession = await getAdminSession(serverSupabase)

    let query = serverSupabase
        .from('posts')
        .select('*')
        .eq('slug', params.slug)

    if (!adminSession) {
        query = query.eq('published', true)
    }

    const { data: post } = await query.single()

    if (!post) {
        notFound()
    }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.created_at,
            dateModified: post.created_at,
            description: post.description,
            image: post.image
              ? `${baseUrl}${post.image}`
              : `/og?title=${encodeURIComponent(post.title)}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'My Portfolio',
            },
          }),
        }}
      />

        <PostGuard published={post.published}>
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="title font-semibold text-2xl tracking-tighter font-serif">
                        {post.title}
                    </h1>
                    <div className="flex justify-between items-center mt-2 mb-8 text-sm">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formatDate(post.created_at)}
                        </p>
                    </div>
                </div>
                <PostActions slug={post.slug} postId={post.id} />
            </div>
            <article className="prose">
                <CustomMDX source={post.mdx_content} />
            </article>
        </PostGuard>
    </section>
  )
}
