var config = require('../config');
var passport = require('passport');
var security = require('../infrastructure/security');

var tokenExpiresInMinutes = 60;

function sendLoggedInResponseForUser (user, res) {
  res.send({
    message: 'Authentication successful',
    token: security.createTokenForUser(user, tokenExpiresInMinutes),
    _links: { 
      self: { href: '/'},
      me: { href: '/me' }, 
      appointments: { href: '/appointments' } 
    }
  });
}

function sendTokenValidationError (res, err) {
  res.send('401', {
    message: 'Access denied (unable to authenticate)',
    details: err
  });
}

function createUserFromProfile (profile) {
  return {
    provider: profile.provider,
    userId: profile.id,
    email: profile.emails[0].value,
    displayName: profile.displayName
  };
}

exports.loggedin = function (req, res) {
  // A very hacky way to get the auth token to the JS client after the oauth redirect flow.
  var token = security.createTokenForUser(req.user, tokenExpiresInMinutes)
  var response = 
  '<html><head>' +
  '<script>' +
  'if (window.opener) { window.opener.postMessage("' + token + '", "*"); } else { window.location.hash = "token=' + token + '" }' +
  '</script>' +
  '</head><body></body></html>';
  res.set('Content-Type', 'text/html');
  res.send(response);
}

exports.facebooktoken = function (req, res) {
  // NOTE: this (ab)uses the passport strategy-specific userProfile method to check if a token is valid.
  var fbStrategy = passport._strategies.facebook;
  fbStrategy.userProfile(req.body.token, function (err, profile) {
    if (err) {
      return sendTokenValidationError(res, err);
    }
    var user = createUserFromProfile(profile);
    sendLoggedInResponseForUser(user, res);
  });
}

exports.googletoken = function (req, res) {
  // NOTE: this (ab)uses the passport strategy-specific userProfile method to check if a token is valid.
  var googleStrategy = passport._strategies.google;
  googleStrategy.userProfile(req.body.token, function (err, profile) {
    if (err) {
      return sendTokenValidationError(res, err);
    }
    var user = createUserFromProfile(profile);
    sendLoggedInResponseForUser(user, res);
  });
}