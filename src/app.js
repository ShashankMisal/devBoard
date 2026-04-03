const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const asyncWrapper = require('./middlewares/asyncWrapper');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const { morganStream } = require('./utils/logger');

const app = express();
const apiRouter = express.Router();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allowing requests without an Origin header keeps health checks and server-to-server calls working.
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(ApiError.forbidden('CORS policy does not allow access from this origin.'));
    }
  })
);

app.use(morgan('combined', { stream: morganStream }));
app.use(cookieParser());

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
app.use('/api/v1', apiRouter);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} does not exist.`));
});

app.use(errorHandler);

module.exports = app;
