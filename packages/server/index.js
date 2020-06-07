const path = require('path');

const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const createError = require('http-errors');
const klawSync = require('klaw-sync');

const authRouter = require('./routes/authRouter');
const { isAllowedGatsbyPath } = require('./isAllowedGatsbyPath');

const config = require('./config');

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: config.AUTH0_DOMAIN,
    clientID: config.AUTH0_CLIENT_ID,
    clientSecret: config.AUTH0_CLIENT_SECRET,
    callbackURL: config.AUTH0_CALLBACK_URL,
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

/** @type {session.SessionOptions} */
const expressSessionOptions = {
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  secret: config.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
};

if (app.get('env') === 'production') {
  // For Heroku, Render or other platforms using a proxy
  app.set('trust proxy', 1);

  // Serve secure cookies, requires https
  expressSessionOptions.cookie = { secure: true };
}

app.use(session(expressSessionOptions));

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

const existingFiles = klawSync(
  path.join(__dirname, '..', 'gatsby-website', 'public'),
  {
    traverseAll: true,
  },
).map(
  ({ path: filePath, stats }) =>
    // Return relative path
    filePath.split('packages/gatsby-website/public')[1] +
    // Append slash to directories
    (stats.isDirectory() ? '/' : ''),
);

app.use(function secured(req, res, next) {
  // Catch 404 and forward to error handler
  if (req.path !== '/' && !existingFiles.includes(req.path)) {
    next(createError(404));
    return;
  }

  if (req.user) {
    if (!isAllowedGatsbyPath(req.url)) {
      res.status(403);
      res.send('Access denied.');
      return;
    }

    return next();
  }

  // If the original requested URL ends with a slash,
  // save it to redirect to it after login.
  //
  // If the original requested URL doesn't end with a
  // slash, don't redirect to it, because it could
  // possibly be a URL to a JSON or other type of file,
  // such as the URL below.
  //
  // http://localhost:3000/page-data/app-data.json
  if (
    req.session &&
    typeof req.originalUrl === 'string' &&
    req.originalUrl.endsWith('/')
  ) {
    req.session.returnTo = req.originalUrl;
  }

  res.redirect('/login');
});

// Serve the Gatsby static generated site assets
// Requires that the `build` script was run in packages/gatsby-website
app.use(express.static(path.join(__dirname, '..', 'gatsby-website', 'public')));

// Error handler
app.use(function (err, req, res, next) {
  // Handle 404 (file not found) errors
  if (err.status === 404) {
    res.status(err.status);
    res.sendFile(
      path.join(
        __dirname,
        '..',
        'gatsby-website',
        'public',
        '404',
        'index.html',
      ),
    );
    return;
  }

  res.status(err.status || 500);
  res.send(`
    Error!<br><br>${err.message}

    ${
      // Show error stack in development
      app.get('env') === 'development'
        ? `<br><br><pre>${err.stack || JSON.stringify(err)}</pre>`
        : ''
    }
  `);
});

const port = config.PORT || 3000;
app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
