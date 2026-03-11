import ogs from "open-graph-scraper";
import { visit } from "unist-util-visit";

function resolveUrl(maybeRelativeUrl, baseUrl) {
    if (!maybeRelativeUrl) return "";

    try {
        return new URL(maybeRelativeUrl, baseUrl).toString();
    } catch {
        return "";
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function isValidBareLinkParagraph(node) {
    if (!node?.children?.length) return false;

    const nonWhitespaceChildren = node.children.filter(
        (child) => !(child.type === "text" && /^\s*$/.test(child.value))
    );

    if (nonWhitespaceChildren.length !== 1) return false;
    if (nonWhitespaceChildren[0].type !== "link") return false;

    const linkNode = nonWhitespaceChildren[0];
    const url = linkNode.url?.trim();

    if (!url || !/^https?:\/\/\S+$/.test(url)) return false;

    const linkText = (linkNode.children || [])
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("")
        .trim();

    if (!linkText || linkText !== url) return false;

    return true;
}

function buildCardHtml({ url, title, description, image, favicon, domain, siteName }) {
    const safeUrl = escapeHtml(url);
    const safeTitle = escapeHtml(title || url);
    const safeDescription = escapeHtml(description || "");
    const safeImage = image ? escapeHtml(image) : "";
    const safeFavicon = favicon ? escapeHtml(favicon) : "";
    const safeDomain = escapeHtml(domain || "");
    const safeSiteName = escapeHtml(siteName || domain || "");

    return `
<a
  href="${safeUrl}"
  target="_blank"
  rel="noopener noreferrer"
  class="link-card not-prose card my-6 overflow-hidden border border-base-300 bg-base-100 no-underline shadow-sm transition hover:border-base-content/20 hover:shadow-md md:h-32 md:flex-row"
>
  ${safeImage
            ? `
  <figure class="order-1 aspect-video w-full shrink-0 overflow-hidden bg-base-200 md:order-2 md:w-1/3 md:aspect-auto rounded-none
">
    <img
      src="${safeImage}"
      alt=""
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover"
    />
  </figure>
  `
            : ""
        }

  <div class="card-body order-2 min-w-0 flex-1 p-4 md:order-1">
    <div class="truncate text-xs opacity-60">${safeSiteName}</div>

    <div class="card-title line-clamp-2 text-base leading-tight text-base-content">
      ${safeTitle}
    </div>

    ${safeDescription
            ? `
    <p class="line-clamp-2 text-sm text-base-content/70 md:line-clamp-1">
      ${safeDescription}
    </p>
    `
            : ""
        }

    <div class="mt-auto flex items-center gap-2">
      ${safeFavicon
            ? `
      <img
        src="${safeFavicon}"
        alt=""
        class="h-4 w-4 rounded-sm"
        loading="lazy"
        decoding="async"
      />
      `
            : ""
        }
      <span class="truncate text-xs text-base-content/50">${safeDomain}</span>
    </div>
  </div>
</a>
  `.trim();
}

export function remarkBlogCard() {
    const cache = new Map();

    async function fetchCardMeta(url) {
        if (cache.has(url)) {
            return cache.get(url);
        }

        const promise = ogs({
            url,
            timeout: 10000,
            onlyGetOpenGraphInfo: false,
            fetchOptions: {
                headers: {
                    "user-agent": "Mozilla/5.0 (compatible; AstroBlogCard/1.0)",
                    accept: "text/html,application/xhtml+xml",
                },
                redirect: "follow",
            },
        })
            .then(({ result }) => {
                const domain = new URL(url).hostname;

                return {
                    url,
                    title: result?.ogTitle || result?.twitterTitle || url,
                    description: result?.ogDescription || result?.twitterDescription || "",
                    image: resolveUrl(
                        result?.ogImage?.[0]?.url || result?.twitterImage?.[0]?.url,
                        url
                    ),
                    favicon: resolveUrl(result?.favicon, url),
                    domain,
                    siteName: result?.ogSiteName || result?.twitterSite || domain,
                };
            })
            .catch(() => {
                const domain = new URL(url).hostname;

                return {
                    url,
                    title: url,
                    description: "",
                    image: "",
                    favicon: "",
                    domain,
                    siteName: domain,
                };
            });

        cache.set(url, promise);
        return promise;
    }

    return async (tree) => {
        const promises = [];

        visit(tree, "paragraph", (node, index, parent) => {
            if (!parent || index == null) return;
            if (!isValidBareLinkParagraph(node)) return;

            const linkNode = node.children.find((child) => child.type === "link");
            const url = linkNode.url.trim();

            const promise = fetchCardMeta(url).then((meta) => {
                const html = buildCardHtml(meta);

                parent.children.splice(index, 1, {
                    type: "html",
                    value: html,
                });
            });

            promises.push(promise);
        });

        await Promise.all(promises);
    };
}