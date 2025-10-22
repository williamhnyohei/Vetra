/**
 * Prometheus Configuration
 * Metrics collection and monitoring
 */

const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const riskAnalysisTotal = new client.Counter({
  name: 'risk_analysis_total',
  help: 'Total number of risk analyses performed',
  labelNames: ['risk_level'],
});

const attestationTotal = new client.Counter({
  name: 'attestations_total',
  help: 'Total number of attestations created',
  labelNames: ['provider', 'risk_level'],
});

const databaseConnections = new client.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
});

const redisConnections = new client.Gauge({
  name: 'redis_connections',
  help: 'Number of Redis connections',
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(riskAnalysisTotal);
register.registerMetric(attestationTotal);
register.registerMetric(databaseConnections);
register.registerMetric(redisConnections);

// Middleware to collect HTTP metrics
const collectHttpMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Function to update connection metrics
const updateConnectionMetrics = (active, db, redis) => {
  activeConnections.set(active);
  databaseConnections.set(db);
  redisConnections.set(redis);
};

// Function to record risk analysis
const recordRiskAnalysis = (riskLevel) => {
  riskAnalysisTotal.labels(riskLevel).inc();
};

// Function to record attestation
const recordAttestation = (provider, riskLevel) => {
  attestationTotal.labels(provider, riskLevel).inc();
};

module.exports = {
  register,
  collectHttpMetrics,
  updateConnectionMetrics,
  recordRiskAnalysis,
  recordAttestation,
};
