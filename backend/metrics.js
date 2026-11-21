
const client = require('prom-client');

const register = new client.Registry();

// Collect Node.js metrics: CPU, memory, event loop.
client.collectDefaultMetrics({
    register,
    prefix: 'ticket_booking_'
});

// Count HTTP requests.
const requestsTotal = new client.Counter({
    name: 'ticket_booking_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// Measure request duration.
const requestDuration = new client.Histogram({
    name: 'ticket_booking_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

function metricsMiddleware(req, res, next) {
    // Avoid counting Prometheus scrapes.
    if (req.path === '/metrics') {
        return next();
    }

    const endTimer = requestDuration.startTimer();

    res.on('finish', () => {
        const labels = {
            method: req.method,
            route: req.route?.path || 'unmatched',
            status_code: String(res.statusCode)
        };

        requestsTotal.inc(labels);
        endTimer(labels);
    });

    next();
}

module.exports = {
    register,
    metricsMiddleware
};
