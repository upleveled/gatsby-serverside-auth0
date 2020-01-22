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

// Regular expression to match allowed assets related
// to src/pages/index.mdx in the Gatsby website.
//
// Trying to navigate to assets related to src/pages/page-2.mdx
// will return an "Access denied."
const allowedGatsbyWebsiteUrls = /^(\/|\/(webpack-runtime|app|styles|commons|component---src-pages-index-mdx)-[a-z0-9]+\.js|\/page-data\/(index\/)?(page|app)-data.json|\/(static|icons)\/.+\.png(\?v=[a-z0-9]+)?)(\?[^/]+)?$/;

app.use(function secured(req, res, next) {
  if (req.user) {
    if (!req.url.match(allowedGatsbyWebsiteUrls)) {
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
