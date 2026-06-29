import { notFound } from 'next/navigation'
import { CustomMDX } from 'app/components/mdx'
import { baseUrl } from 'app/sitemap'
import { supabase } from "@lib/superbase";
import type { Metadata } from 'next'
import {formatDate} from "@/app/blog/utils/post.server";
import {PostActions} from "@/app/blog/[slug]/components/PostActions";
import {PostGuard} from "@/app/blog/[slug]/components/PostGuard";
import { applyWorkCaseStudyPresentation, getWorkCaseStudy } from '@lib/work-case-studies'
import { createServerSupabase } from '@lib/supabase-server'
import { getAdminSession } from '@lib/auth/admin'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true)
    .eq('category', 'experience')

  return posts?.map((post) => ({
    slug: post.slug,
  })) ?? []
}

export async function generateMetadata({ params }): Promise<Metadata | undefined> {
    const caseStudy = getWorkCaseStudy(params.slug)

    if (caseStudy) {
        const ogImage = `${baseUrl}/og?title=${encodeURIComponent(caseStudy.displayTitle)}`

        return {
            title: caseStudy.displayTitle,
            description: caseStudy.description,
            openGraph: {
                title: caseStudy.displayTitle,
                description: caseStudy.description,
                type: 'article',
                url: `${baseUrl}/work/${params.slug}`,
                images: [{ url: ogImage }],
            },
            twitter: {
                card: 'summary_large_image',
                title: caseStudy.displayTitle,
                description: caseStudy.description,
                images: [ogImage],
            },
        }
    }

    const { data: post } = await supabase
        .from('posts')
        .select('title, description, image, created_at, slug, published')
        .eq('slug', params.slug)
        .eq('published', true)
        .single()

    if (!post) return undefined

  const presentedPost = applyWorkCaseStudyPresentation(post)

  const {
    title,
    description,
    image,
    created_at: publishedTime,
    slug,
  } = presentedPost

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
      url: `${baseUrl}/work/${slug}`,
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

export default async function WorkPost({ params }) {
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

    const presentedPost = applyWorkCaseStudyPresentation(post)
    const caseStudy = getWorkCaseStudy(post.slug)

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: presentedPost.title,
            datePublished: post.created_at,
            dateModified: post.created_at,
            description: presentedPost.description,
            image: post.image
              ? `${baseUrl}${post.image}`
              : `${baseUrl}/og?title=${encodeURIComponent(presentedPost.title)}`,
            url: `${baseUrl}/work/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'Kim Yiseul',
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
            {caseStudy && (
                <section className="mb-8 border-y border-neutral-100 dark:border-neutral-800 py-5">
                    <div className="flex items-center gap-1 mb-4">
                        <span className="px-2.5 py-1 rounded-sm text-xs font-medium bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900">
                            Case
                        </span>
                    </div>
                    <dl className="grid gap-4 grid-cols-1">
                        {Object.entries(caseStudy.summary).map(([label, text]) => (
                            <div key={label}>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                    {label}
                                </dt>
                                <dd className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    {text}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}
            <article className="prose">
                <CustomMDX source={post.mdx_content} />
            </article>
        </PostGuard>
    </section>
  )
}
