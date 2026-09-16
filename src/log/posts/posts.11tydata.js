module.exports = {
    layout: "post.njk",
    tags: "log",
    section: "log",
    eleventyComputed: {
        lang: (data) => (data.page.inputPath.match(/\.(ru|en)\.md$/) || [, "ru"])[1],
        slug: (data) => data.page.fileSlug.replace(/\.(ru|en)$/, ""),
        permalink: (data) => `/${data.lang}/log/${data.slug}/`,
    },
};
