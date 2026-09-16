const slugify = require("@sindresorhus/slugify").default;
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

const LOCALES = ["ru", "en"];

// IBM Plex Mono is monospace, so rendered width is exactly proportional to
// character count — this lets us compute a duration per list at build time
// (no runtime measurement) so differently-long roller lists move at the same
// visual speed instead of all sharing one fixed duration.
const ROLLER_CHARS_PER_SECOND = 7;
// "| " prefix (2ch, via ::before) + margin-right: 1ch, per item — see styles.css
const ROLLER_CHARS_PER_ITEM_OVERHEAD = 3;

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(syntaxHighlight, {
        preAttributes: { "data-language": (context) => context.language },
    });

    eleventyConfig.addPassthroughCopy("src/styles.css");
    eleventyConfig.addPassthroughCopy("src/new-fav.svg");
    eleventyConfig.addPassthroughCopy("src/fav-white.svg");
    eleventyConfig.addPassthroughCopy("src/founder.png");
    eleventyConfig.addPassthroughCopy("src/CNAME");
    eleventyConfig.addPassthroughCopy("src/.nojekyll");


    eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));
    eleventyConfig.addFilter("displayTags", (tags) => (tags || []).filter((tag) => tag !== "things"));

    eleventyConfig.addGlobalData("locales", LOCALES);

    eleventyConfig.addFilter("rollerDuration", (items) => {
        const totalChars = (items || []).reduce(
            (sum, item) => sum + item.length + ROLLER_CHARS_PER_ITEM_OVERHEAD,
            0
        );
        return (totalChars / ROLLER_CHARS_PER_SECOND).toFixed(2);
    });

    // both locales are always prefixed — "/things/" + "ru" -> "/ru/things/"
    eleventyConfig.addFilter("localeUrl", (path, lang) => `/${lang}${path}`);

    // language switcher on static pages — the mirror page always exists, so a
    // plain URL swap is safe (unlike posts, where a translation may not exist)
    eleventyConfig.addFilter("otherLocaleUrl", (url) => {
        const other = url.startsWith("/ru/") ? "en" : "ru";
        return url.replace(/^\/(ru|en)\//, `/${other}/`);
    });

    // URL for the language switcher on a post: the sibling-language version if one
    // exists, otherwise the section index (log/things) in the other locale — the
    // switcher is never hidden. Pairing key is an explicit `translationId` front
    // matter field (falls back to `slug`) — filenames/slugs are allowed to differ
    // per locale now, so slug alone can no longer be relied on for pairing.
    eleventyConfig.addFilter("postTranslationUrl", (collection, key, lang, section) => {
        const sibling = (collection || []).find(
            (item) => (item.data.translationId || item.data.slug) === key && item.data.lang !== lang
        );
        if (sibling) return sibling.url;
        const other = lang === "ru" ? "en" : "ru";
        return `/${other}/${section}/`;
    });

    eleventyConfig.addCollection("thingsTagPages", (collectionApi) => {
        const items = collectionApi.getFilteredByTag("things");
        const tagsByLang = {};
        for (const lang of LOCALES) {
            const tags = new Set();
            items
                .filter((item) => item.data.lang === lang)
                .forEach((item) => (item.data.tags || []).forEach((tag) => {
                    if (tag !== "things") tags.add(tag);
                }));
            tagsByLang[lang] = [...tags].sort();
        }

        // Precomputed here (not looked up cross-page via collections.all at render
        // time) because a tag page's own eleventyComputed fields aren't reliably
        // visible to OTHER pages rendered earlier in the same pagination pass —
        // a tag may only exist on one locale's posts, so the mirror isn't guaranteed.
        const urlFor = (lang, tag) => `/${lang}/things/tag/${slugify(tag)}/`;
        const pages = [];
        for (const lang of LOCALES) {
            const other = lang === "ru" ? "en" : "ru";
            tagsByLang[lang].forEach((tag) => {
                pages.push({
                    lang,
                    tag,
                    // never "" — falls back to the things index in the other locale
                    // so the language switcher is never hidden
                    translationUrl: tagsByLang[other].includes(tag) ? urlFor(other, tag) : `/${other}/things/`,
                });
            });
        }
        return pages;
    });

    return {
        // Nunjucks everywhere — keeps eleventyComputed/permalink filter syntax
        // consistent between .njk templates and .md front matter (default is Liquid).
        markdownTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        dir: {
            input: "src",
            includes: "_includes",
            output: "_site",
        },
    };
};
