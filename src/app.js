const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config/config');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const asyncWrapper = require('./middlewares/asyncWrapper');
const errorHandler = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { openApiSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/project.routes');
const { projectTaskRouter, taskRouter } = require('./modules/tasks/task.routes');
const userRoutes = require('./modules/users/user.routes');
const { buildRequestLogLine, morganStream } = require('./utils/logger');

const app = express();
const apiRouter = express.Router();

const mongoSanitizeMiddleware = (req, _res, next) => {
  // Sanitizing in place keeps the protection from express-mongo-sanitize without tripping Express 5's read-only query setter.
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });

  next();
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  })
);

app.use(
  cors({
    credentials: config.cors.credentials,
    origin: (origin, callback) => {
      // Allowing requests without an Origin header keeps health checks and server-to-server calls working.
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(ApiError.forbidden('CORS policy does not allow access from this origin.'));
    }
  })
);

app.use((req, res, next) => {
  const incomingRequestId = req.get(config.security.requestIdHeader);
  req.id = incomingRequestId || uuidv4();
  res.setHeader(config.security.requestIdHeader, req.id);
  next();
});

morgan.token('id', (req) => req.id);

const morganFormat = config.app.isProduction ? 'combined' : 'dev';
const morganMessageFactory = (tokens, req, res) => buildRequestLogLine(tokens, req, res, morganFormat);

app.use(morgan(morganMessageFactory, { stream: morganStream }));
app.use(cookieParser());
app.use(generalLimiter);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
);

app.use(mongoSanitizeMiddleware);
app.use(hpp());

app.get(
  '/health',
  asyncWrapper(async (req, res) => {
    const response = new ApiResponse(200, 'Service is healthy.', {
      service: config.app.name,
      environment: config.app.env
    });

    res.status(response.statusCode).json(response);
  })
);

// Serving docs from the app keeps the API contract discoverable for frontend, QA, and backend work.
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUiOptions));

apiRouter.get(
  '/',
  asyncWrapper(async (req, res) => {
    const response = new ApiResponse(200, 'DevBoard API foundation is ready.', {
      version: 'v1'
    });

    res.status(response.statusCode).json(response);
  })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects/:projectId/tasks', projectTaskRouter);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1', apiRouter);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} does not exist.`));
});

app.use(errorHandler);

module.exports = app;
