import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { html } from "satori-html";

export const prerender = true;

type Props = {
    title: string;
    description: string;
    publishedAt: string;
};

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_400_PATH = resolve(
    process.cwd(),
    "src/assets/fonts/NotoSansJP-Regular.ttf",
);
const FONT_700_PATH = resolve(
    process.cwd(),
    "src/assets/fonts/NotoSansJP-Bold.ttf",
);
let fontDataPromise: Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> | null =
    null;

const trimText = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const escapeHtml = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");

const getFontData = async () => {
    if (!fontDataPromise) {
        fontDataPromise = (async () => {
            const [regularRaw, boldRaw] = await Promise.all([
                readFile(FONT_400_PATH),
                readFile(FONT_700_PATH),
            ]);
            const regularView = new Uint8Array(regularRaw);
            const boldView = new Uint8Array(boldRaw);

            return {
                regular: regularView.buffer.slice(
                    regularView.byteOffset,
                    regularView.byteOffset + regularView.byteLength,
                ),
                bold: boldView.buffer.slice(
                    boldView.byteOffset,
                    boldView.byteOffset + boldView.byteLength,
                ),
            };
        })();
    }

    return fontDataPromise;
};

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
    const safeTitle = escapeHtml(trimText(title, 72));
    const safeDescription = escapeHtml(trimText(description, 110));
    const safePublishedAt = escapeHtml(publishedAt);
    const fontData = await getFontData();

    const markup = html(`
<div style="width: 1200px; height: 630px; display: flex; background: #0b1220; padding: 52px; box-sizing: border-box;">
  <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #334155; border-radius: 24px; background: #111827; padding: 56px; box-sizing: border-box;">
    <div style="display: flex; flex-direction: column; gap: 26px;">
      <div style="font-size: 24px; color: #93c5fd; font-weight: 700;">samenoko.work</div>
      <div style="font-size: 52px; line-height: 1.28; color: #f8fafc; font-weight: 700;">${safeTitle}</div>
      <div style="font-size: 28px; line-height: 1.5; color: #cbd5e1;">${safeDescription}</div>
    </div>
    <div style="font-size: 22px; color: #94a3b8;">${safePublishedAt}</div>
  </div>
</div>
`);

    const svg = await satori(markup, {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
            {
                name: "Noto Sans JP",
                data: fontData.regular,
                weight: 400,
                style: "normal",
            },
            {
                name: "Noto Sans JP",
                data: fontData.bold,
                weight: 700,
                style: "normal",
            },
        ],
    });

    const png = new Resvg(svg, {
        fitTo: {
            mode: "width",
            value: WIDTH,
        },
    })
        .render()
        .asPng();
    const body = new Uint8Array(png);

    return new Response(body, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
};
