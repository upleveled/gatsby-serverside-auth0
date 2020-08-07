// Old solution:
// Regular expression to match allowed assets related
// to src/pages/index.mdx in the Gatsby website.
//
// Trying to navigate to assets related to src/pages/page-2.mdx
// will return an "Access denied."
// const allowedGatsbyWebsiteUrls = /^(\/|\/(webpack-runtime|app|styles|commons|component---src-pages-index-mdx)-[a-z0-9]+\.js|\/page-data\/(index\/)?(page|app)-data.json|\/(static|icons)\/.+\.png(\?v=[a-z0-9]+)?)(\?[^/]+)?$/;

// New solution:

// Require the Gatsby asset manifest from the build
// to get paths to all assets that are required by
// each "named chunk group" (each named chunk group
// corresponds to a page).
//
// Ref: https://github.com/gatsbyjs/gatsby/issues/20745#issuecomment-577685950
const {
  namedChunkGroups,
} = require('../gatsby-website/public/webpack.stats.json');

function pageToWebpackFormat(page) {
  // Replace slashes and periods with hyphens
  return page.replace(/(\/|\.)/g, '-');
}

function pageToGatsbyPageDataPath(page) {
  // Strip the /index.mdx at the end of the page
  // If it's the index, just strip the .mdx
  return page.replace(/(\/index)?\.mdx$/, '');
}

function pageToWebPaths(page) {
  // Strip one of the following postfixes at the
  // end of the page, depending on what exists
  // in the path
  // - /index.mdx
  // - index.mdx
  // - .mdx
  let pageWithoutIndex = page.replace(/((\/)?index)?\.mdx$/, '');
  // Add a slash, but only for non-root paths
  if (pageWithoutIndex !== '') pageWithoutIndex += '/';
  return [pageWithoutIndex, pageWithoutIndex + 'index.html'];
}

function getPathsForPages(pages) {
  return (
    pages
      .map((page) => {
        return [
          // All asset paths from the webpack manifest
          ...namedChunkGroups[
            `component---src-pages-${pageToWebpackFormat(page)}`
          ].assets,
          // All of the Gatsby page-data.json files
          `page-data/${pageToGatsbyPageDataPath(page)}/page-data.json`,
          ...pageToWebPaths(page),
        ];
      })
      // Flatten out the extra level of array nesting
      .flat()
      .concat(
        // Everything general for the app
        ...namedChunkGroups.app.assets,
        'page-data/404.html/page-data.json',
        'page-data/app-data.json',
      )
      .filter(
        (assetPath) =>
          // Root
          assetPath === '' ||
          // Only paths ending with js, json, html and slashes
          assetPath.match(/(\.(html|js|json)|\/)$/),
      )
      // Add a leading slash to make a root-relative path
      // (to match Express' req.url)
      .map((assetPath) => '/' + assetPath)
  );
}

const allowedWebpackAssetPaths = getPathsForPages([
  'index.mdx',
  '404.mdx',
  'page-3.mdx',
]);

module.exports.isAllowedGatsbyPath = function isAllowedGatsbyPath(filePath) {
  const pathWithoutQuery = filePath.replace(/^([^?]+).*$/, '$1');

  // Allow access to the manifest in the root
  if (pathWithoutQuery === '/manifest.webmanifest') return true;

  // Allow access to images within static and icons (large favicons)
  if (pathWithoutQuery.match(/\.(png|jpg)$/)) {
    if (
      pathWithoutQuery.startsWith('/static/') ||
      pathWithoutQuery.startsWith('/icons/')
    ) {
      return true;
    }
  }

  // Allow access to the static query results
  // https://github.com/gatsbyjs/gatsby/pull/25723/files#diff-917ba78a52f29b1a1fe42be34d81fc83R64
  // https://github.com/gatsbyjs/gatsby/pull/26242
  if (pathWithoutQuery.match(/^\/page-data\/sq\/d\/\d+\.json$/)) {
    return true;
  }

  // Allow access to other favicons
  if (pathWithoutQuery.match(/^\/favicon(-32x32\.png|\.ico)$/)) {
    return true;
  }

  return allowedWebpackAssetPaths.includes(pathWithoutQuery);
};
