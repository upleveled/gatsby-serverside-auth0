const express = require('express');
const router = express.Router();
const passport = require('passport');
const dotenv = require('dotenv');
const util = require('util');
const url = require('url');
const querystring = require('querystring');

dotenv.config();

// Perform the login, after login Auth0 will redirect to callback
router.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  function (req, res) {
    res.redirect('/');
  },
);

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (auth0Error, user, info) {
    if (auth0Error) {
      return next(auth0Error);
    }
    req.logIn(user, function (loginError) {
      if (loginError) {
        return next(loginError);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
  req.logout();

  let returnTo = req.protocol + '://' + req.hostname;
  const port = req.connection.localPort;
  if (
    req.hostname === 'localhost' &&
    port !== undefined &&
    port !== 80 &&
    port !== 443
  ) {
    returnTo += ':' + port;
  }

  const logoutURL = new url.URL(
    util.format('https://%s/logout', process.env.AUTH0_DOMAIN),
  );

  logoutURL.search = querystring.stringify({
    client_id: config.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });

  res.redirect(logoutURL);
});

module.exports = router;
