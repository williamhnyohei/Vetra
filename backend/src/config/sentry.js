/**
 * Sentry Configuration
 * Error tracking and monitoring
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.exception) {
      event.exception.values.forEach(exception => {
        if (exception.stacktrace) {
          exception.stacktrace.frames.forEach(frame => {
            if (frame.filename && frame.filename.includes('node_modules')) {
              frame.filename = frame.filename.replace(/.*node_modules/, 'node_modules');
            }
          });
        }
      });
    }
    
    return event;
  },
});

module.exports = Sentry;
