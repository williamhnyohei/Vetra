/**
 * Passport Configuration
 * Google OAuth and JWT authentication setup
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { db } = require('./database');
const logger = require('../utils/logger');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract user information from Google profile
    const userData = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0].value,
    };

    logger.info('Google OAuth authentication', {
      userId: userData.id,
      email: userData.email,
    });

    // Return user data to be handled by the route
    return done(null, userData);

  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Configure JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256'],
}, async (payload, done) => {
  try {
    // Find user by ID from JWT payload
    const user = await db('users')
      .where({ id: payload.userId })
      .first();

    if (!user) {
      return done(null, false);
    }

    if (!user.is_active) {
      return done(null, false);
    }

    // Return user data
    return done(null, {
      userId: user.id,
      email: user.email,
      subscription_plan: user.subscription_plan,
    });

  } catch (error) {
    logger.error('JWT authentication error:', error);
    return done(error, false);
  }
}));

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (if using sessions)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db('users')
      .where({ id })
      .first();

    if (!user) {
      return done(null, false);
    }

    done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_plan: user.subscription_plan,
    });

  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

module.exports = passport;
