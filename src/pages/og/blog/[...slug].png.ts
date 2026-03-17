import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { resolve } from "node:path";
import sharp from "sharp";

export const prerender = true;

type Props = {
    title: string;
    description: string;
    publishedAt: string;
};

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FILE_PATH = resolve(process.cwd(), "src/assets/fonts/NotoSansJP.ttf");
const CONTENT_X = 112;

const trimText = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const escapePango = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const createBackgroundSvg = () => `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect x="52" y="52" width="1096" height="526" rx="28" fill="#0f172a" fill-opacity="0.7" stroke="#334155" stroke-width="2" />
  <rect x="52" y="116" width="1096" height="2" fill="#1e293b" />
</svg>
`;

export const getStaticPaths = (async () => {
    const posts = await getCollection("blog", ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    return posts.map((post) => ({
        params: { slug: post.id },
        props: {
            title: post.data.title,
            description: post.data.description,
            publishedAt: post.data.pubDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }),
        } satisfies Props,
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
    const { title, description, publishedAt } = props as Props;
    const safeTitle = escapePango(trimText(title, 72));
    const safeDescription = escapePango(trimText(description, 110));
    const safePublishedAt = escapePango(publishedAt);

    const png = await sharp(Buffer.from(createBackgroundSvg()))
        .composite([
            {
                input: {
                    text: {
                        text: "<span foreground=\"#93c5fd\">samenoko.work</span>",
                        font: "Noto Sans JP Bold 22",
                        fontfile: FONT_FILE_PATH,
                        width: 980,
                        rgba: true,
                        dpi: 72,
                    },
                },
                left: CONTENT_X,
                top: 78,
            },
            {
                input: {
                    text: {
                        text: `<span foreground="#f8fafc">${safeTitle}</span>`,
                        font: "Noto Sans JP Bold 36",
                        fontfile: FONT_FILE_PATH,
                        width: 980,
                        rgba: true,
                        dpi: 72,
                    },
                },
                left: CONTENT_X,
                top: 170,
            },
            {
                input: {
                    text: {
                        text: `<span foreground="#cbd5e1">${safeDescription}</span>`,
                        font: "Noto Sans JP 22",
                        fontfile: FONT_FILE_PATH,
                        width: 980,
                        rgba: true,
                        dpi: 72,
                    },
                },
                left: CONTENT_X,
                top: 356,
            },
            {
                input: {
                    text: {
                        text: `<span foreground="#94a3b8">Published ${safePublishedAt}</span>`,
                        font: "Noto Sans JP 18",
                        fontfile: FONT_FILE_PATH,
                        width: 980,
                        rgba: true,
                        dpi: 72,
                    },
                },
                left: CONTENT_X,
                top: 520,
            },
        ])
        .png()
        .toBuffer();
    const body = new Uint8Array(png);

    return new Response(body, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
};
