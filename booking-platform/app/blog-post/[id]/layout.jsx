import { supabase } from '@database/connection/supabase';
import { defaultBlogs } from '../data';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  const normalizedId = (id || '').trim();
  const staticBlog = defaultBlogs.find(b => b.slug === normalizedId || b.id === normalizedId);
  
  if (staticBlog) {
    return {
      title: `${staticBlog.title} | Magnevents`,
      description: staticBlog.subtitle || 'Read the latest insights and artist news from Magnevents.',
      alternates: {
        canonical: `/blog-post/${staticBlog.slug || normalizedId}`,
      },
      openGraph: {
        title: `${staticBlog.title} | Magnevents`,
        description: staticBlog.subtitle,
        images: [staticBlog.img || '/icon-512.png'],
        url: `/blog-post/${staticBlog.slug || normalizedId}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${staticBlog.title} | Magnevents`,
        description: staticBlog.subtitle,
        images: [staticBlog.img || '/icon-512.png'],
      }
    };
  }

  try {
    let blogData = null;
    const { data } = await supabase.from('blogs').select('*').eq('slug', normalizedId).single();
    if (data) {
      blogData = data;
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(normalizedId)) {
        const { data: dataById } = await supabase.from('blogs').select('*').eq('id', normalizedId).single();
        if (dataById) blogData = dataById;
      }
    }

    if (!blogData) {
      return {
        title: 'Article Not Found | Magnevents',
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    }

    const title = `${blogData.title} | Magnevents`;
    const description = blogData.subtitle || 'Read the latest insights and artist news from Magnevents.';
    const image = blogData.image_url || '/icon-512.png';
    const canonicalSlug = blogData.slug || normalizedId;

    return {
      title,
      description,
      alternates: {
        canonical: `/blog-post/${canonicalSlug}`,
      },
      openGraph: {
        title,
        description,
        images: [image],
        url: `/blog-post/${canonicalSlug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      }
    };
  } catch (err) {
    console.error('Error in blog generateMetadata:', err);
    return {
      title: 'Article Not Found | Magnevents',
      robots: { index: false, follow: false }
    };
  }
}

export default async function BlogLayout({ children, params }) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  const normalizedId = (id || '').trim();
  const staticBlog = defaultBlogs.find(b => b.slug === normalizedId || b.id === normalizedId);
  
  let blogData = staticBlog || null;

  if (!blogData) {
    try {
      const { data } = await supabase.from('blogs').select('*').eq('slug', normalizedId).single();
      if (data) {
        blogData = data;
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(normalizedId)) {
          const { data: dataById } = await supabase.from('blogs').select('*').eq('id', normalizedId).single();
          if (dataById) blogData = dataById;
        }
      }
    } catch (err) {
      console.error('Error fetching blog in layout:', err);
    }
  }

  if (!blogData) {
    redirect('/artists');
  }

  const title = blogData.title;
  const description = blogData.subtitle || 'Blog post by Magnevents';
  const image = blogData.img || blogData.image_url || '/icon-512.png';
  const canonicalSlug = blogData.slug || normalizedId;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "author": {
      "@type": "Organization",
      "name": "Magnevents"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Magnevents",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.magnevents.in/logo.webp"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.magnevents.in/blog-post/${canonicalSlug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
