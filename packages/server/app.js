const path = require('path');

const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const authRouter = require('./routes/auth');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
      process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  },
);

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

const app = express();

app.use(logger('dev'));
app.use(cookieParser());

// config express-session
const sess = {
  secret: process.env.EXPRESS_SESSION_SECRET,
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
  app.use(function(req, res, next) {
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

function getPathsForPage(page) {
  return [
    ...namedChunkGroups[`component---src-pages-${page}-mdx`].assets,
    `page-data/${page}/page-data.json`,
  ];
}

const allowedWebpackJsAssetPaths = [
  // Everything general for the app
  ...namedChunkGroups.app.assets,
  'page-data/app-data.json',
  // Everything for the index page
  ...getPathsForPage('index'),
]
  // Only JavaScript files
  .filter(assetPath => assetPath.match(/.(js|json)$/))
  // Add a leading slash to make a root-relative path
  // (to match Express' req.url)
  .map(assetPath => '/' + assetPath);

function isAllowedPath(path) {
  const pathWithoutQuery = path.replace(/^([^?]+).*$/, '$1');

  // Allow access to the root path
  if (pathWithoutQuery === '/') return true;

  // Allow access to the manifest
  if (pathWithoutQuery === '/manifest.webmanifest') return true;

  console.log('testing', pathWithoutQuery);

  // Allow access to images within static and icons
  if (pathWithoutQuery.endsWith('png')) {
    if (
      pathWithoutQuery.startsWith('/static/') ||
      pathWithoutQuery.startsWith('/icons/')
    ) {
      return true;
    }
  }

  return allowedWebpackJsAssetPaths.includes(pathWithoutQuery);
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
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(`<pre>${err.stack || JSON.stringify(err)}</pre>`);
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(`Error!<br><br>${err.message}`);
});

module.exports = app;
