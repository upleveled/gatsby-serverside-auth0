const path = require('path');

const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

const authRouter = require('./routes/authRouter');
const config = require('./config');

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: config.AUTH0_DOMAIN,
    clientID: config.AUTH0_CLIENT_ID,
    clientSecret: config.AUTH0_CLIENT_SECRET,
    callbackURL: config.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  },
);

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const app = express();

app.use(logger('dev'));
app.use(cookieParser());

// config express-session
const sess = {
  secret: config.EXPRESS_SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: true,
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // For Heroku, Render or other platforms using a proxy
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());

if (app.get('env') === 'production') {
  app.use(function (req, res, next) {
    if (req.secure) {
      // Request made via https, so do no special handling
      next();
    } else {
      // Request made via http, so redirect to https
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

app.use('/', authRouter);

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

const allowedWebpackAssetPaths = getPathsForPages(['index.mdx', 'page-3.mdx']);

function isAllowedPath(filePath) {
  const pathWithoutQuery = filePath.replace(/^([^?]+).*$/, '$1');

  // Allow access to the manifest
  if (pathWithoutQuery === '/manifest.webmanifest') return true;

  // Allow access to images within static and icons
  if (pathWithoutQuery.endsWith('png')) {
    if (
      pathWithoutQuery.startsWith('/static/') ||
      pathWithoutQuery.startsWith('/icons/')
    ) {
      return true;
    }
  }

  return allowedWebpackAssetPaths.includes(pathWithoutQuery);
}

app.use(function secured(req, res, next) {
  if (req.user) {
    if (!isAllowedPath(req.url)) {
      res.status(403);
      res.send('Access denied.');
      return;
    }

    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
});

// Serve the Gatsby static generated site assets
// Requires that the `build` script was run in packages/gatsby-website
app.use(express.static(path.join(__dirname, '..', 'gatsby-website', 'public')));

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(`<pre>${err.stack || JSON.stringify(err)}</pre>`);
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(`Error!<br><br>${err.message}`);
});

module.exports = app;
