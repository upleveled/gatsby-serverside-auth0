const util = require('util');
const url = require('url');
const passport = require('passport');
const express = require('express');

const querystring = require('querystring');

const config = require('../config');

const authRouter = express.Router();

// Perform the login, after login Auth0 will redirect to callback
authRouter.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  function (req, res) {
    res.redirect('/');
  },
);

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
authRouter.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (auth0Error, user, info) {
    if (auth0Error) return next(auth0Error);
    if (!user) return res.redirect('/login');

    req.logIn(user, function (loginError) {
      if (loginError) return next(loginError);

      let returnTo;

      if (req.session && req.session.returnTo) {
        returnTo = req.session.returnTo;
        delete req.session.returnTo;
      }

      res.redirect(returnTo || '/');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
authRouter.get('/logout', (req, res) => {
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
    util.format('https://%s/logout', config.AUTH0_DOMAIN),
  );

  logoutURL.search = querystring.stringify({
    client_id: config.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });

  res.redirect(logoutURL.toString());
});

module.exports = authRouter;
