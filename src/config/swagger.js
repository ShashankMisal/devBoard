const swaggerUi = require('swagger-ui-express');

const config = require('./config');

const buildSuccessResponse = (description, schema) => ({
  description,
  content: {
    'application/json': {
      schema
    }
  }
});

const errorResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: false
    },
    message: {
      type: 'string',
      example: 'Validation failed.'
    },
    errors: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/FieldError'
      }
    }
  }
};

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'DevBoard API',
    version: '1.0.0',
    description:
      'Production-grade REST API for the DevBoard task board backend. The documentation matters because it gives frontend, QA, and backend engineers a single reliable contract for request bodies, responses, auth requirements, and failure modes.'
  },
  servers: [
    {
      url: `http://localhost:${config.app.port}`,
      description: 'Local development server'
    }
  ],
  tags: [
    { name: 'Health', description: 'Service health and readiness checks' },
    { name: 'Auth', description: 'Registration, login, logout, and token refresh' },
    { name: 'Users', description: 'Authenticated profile management' },
    { name: 'Projects', description: 'Project CRUD and member management' },
    { name: 'Tasks', description: 'Project task management and task operations' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Operation completed successfully.' },
          data: { nullable: true },
          success: { type: 'boolean', example: true }
        }
      },
      FieldError: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'email' },
          message: { type: 'string', example: 'Please provide a valid email address.' }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Shashank' },
          email: { type: 'string', format: 'email', example: 'shashank@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      AuthPayload: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User'
          },
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example'
          }
        }
      },
      RefreshTokenPayload: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example'
          }
        }
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
          title: { type: 'string', example: 'DevBoard Backend' },
          description: { type: 'string', example: 'Core backend project board.' },
          owner: {
            $ref: '#/components/schemas/User'
          },
          members: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          status: {
            type: 'string',
            enum: ['active', 'archived'],
            example: 'active'
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
          title: { type: 'string', example: 'Document API routes' },
          description: { type: 'string', example: 'Write Swagger docs for the existing endpoints.' },
          project: {
            oneOf: [
              { type: 'string', example: '507f1f77bcf86cd799439012' },
              { $ref: '#/components/schemas/Project' }
            ]
          },
          assignee: {
            nullable: true,
            oneOf: [
              { type: 'string', example: '507f1f77bcf86cd799439011' },
              { $ref: '#/components/schemas/User' }
            ]
          },
          createdBy: {
            oneOf: [
              { type: 'string', example: '507f1f77bcf86cd799439011' },
              { $ref: '#/components/schemas/User' }
            ]
          },
          status: {
            type: 'string',
            enum: ['todo', 'in-progress', 'done'],
            example: 'todo'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'high'
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      PaginatedProjects: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' }
          },
          totalDocs: { type: 'integer', example: 5 },
          totalPages: { type: 'integer', example: 1 },
          currentPage: { type: 'integer', example: 1 },
          hasNextPage: { type: 'boolean', example: false },
          hasPrevPage: { type: 'boolean', example: false }
        }
      },
      PaginatedTasks: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' }
          },
          totalDocs: { type: 'integer', example: 8 },
          totalPages: { type: 'integer', example: 1 },
          currentPage: { type: 'integer', example: 1 },
          hasNextPage: { type: 'boolean', example: false },
          hasPrevPage: { type: 'boolean', example: false }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Shashank' },
          email: { type: 'string', format: 'email', example: 'shashank@example.com' },
          password: { type: 'string', example: 'Password1@' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shashank@example.com' },
          password: { type: 'string', example: 'Password1@' }
        }
      },
      RefreshRequest: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh' }
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Shashank Updated' },
          email: { type: 'string', format: 'email', example: 'updated@example.com' }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'DevBoard Backend' },
          description: { type: 'string', example: 'Track backend delivery work.' }
        }
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'DevBoard Backend V2' },
          description: { type: 'string', example: 'Updated project scope.' },
          status: { type: 'string', enum: ['active', 'archived'], example: 'archived' }
        }
      },
      AddMemberRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'member@example.com' }
        }
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Build docs endpoint' },
          description: { type: 'string', example: 'Add Swagger UI to the app.' },
          assignee: { type: 'string', example: '507f1f77bcf86cd799439011' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'], example: 'todo' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
          dueDate: { type: 'string', format: 'date-time' }
        }
      },
      UpdateTaskRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Refine Swagger docs' },
          description: { type: 'string', example: 'Add more response examples.' },
          assignee: { type: 'string', example: '507f1f77bcf86cd799439011', nullable: true },
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'], example: 'done' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
          dueDate: { type: 'string', format: 'date-time', nullable: true }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check service health',
        responses: {
          200: buildSuccessResponse('Service health response', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      service: { type: 'string', example: 'DevBoard API' },
                      environment: { type: 'string', example: 'development' }
                    }
                  }
                }
              }
            ]
          })
        }
      }
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: buildSuccessResponse('User registered successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/AuthPayload' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation or duplicate email error', errorResponseSchema),
          429: buildSuccessResponse('Too many auth attempts', errorResponseSchema)
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in an existing user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('User logged in successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/AuthPayload' }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Invalid credentials', errorResponseSchema),
          429: buildSuccessResponse('Too many auth attempts', errorResponseSchema)
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: buildSuccessResponse('User logged out successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { nullable: true, example: null }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      }
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh the access token using the refresh token cookie or request body',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('Access token refreshed successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/RefreshTokenPayload' }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Invalid or expired refresh token', errorResponseSchema)
        }
      }
    },
    '/api/v1/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get the current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: buildSuccessResponse('Current user profile', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/User' }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update the current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('Current user updated', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/User' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft delete the current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: buildSuccessResponse('Current user deactivated', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/User' }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      }
    },
    '/api/v1/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List accessible projects',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 }
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['active', 'archived'] }
          }
        ],
        responses: {
          200: buildSuccessResponse('Paginated projects', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/PaginatedProjects' }
                }
              }
            ]
          }),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectRequest' }
            }
          }
        },
        responses: {
          201: buildSuccessResponse('Project created successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Project' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      }
    },
    '/api/v1/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get one project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: buildSuccessResponse('Project fetched successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Project' }
                }
              }
            ]
          }),
          403: buildSuccessResponse('Forbidden', errorResponseSchema),
          401: buildSuccessResponse('Unauthorized', errorResponseSchema)
        }
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('Project updated successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Project' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: buildSuccessResponse('Project deleted successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Project' }
                }
              }
            ]
          }),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      }
    },
    '/api/v1/projects/{id}/members': {
      post: {
        tags: ['Projects'],
        summary: 'Add a member to a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddMemberRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('Project member added successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Project' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          403: buildSuccessResponse('Forbidden', errorResponseSchema),
          404: buildSuccessResponse('Member not found', errorResponseSchema)
        }
      }
    },
    '/api/v1/projects/{projectId}/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks for a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'projectId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['todo', 'in-progress', 'done'] } },
          { in: 'query', name: 'priority', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['priority', 'dueDate'] } }
        ],
        responses: {
          200: buildSuccessResponse('Paginated tasks', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/PaginatedTasks' }
                }
              }
            ]
          }),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task inside a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' }
            }
          }
        },
        responses: {
          201: buildSuccessResponse('Task created successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Task' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      }
    },
    '/api/v1/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get one task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: buildSuccessResponse('Task fetched successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Task' }
                }
              }
            ]
          }),
          403: buildSuccessResponse('Forbidden', errorResponseSchema),
          404: buildSuccessResponse('Task not found', errorResponseSchema)
        }
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update one task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTaskRequest' }
            }
          }
        },
        responses: {
          200: buildSuccessResponse('Task updated successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Task' }
                }
              }
            ]
          }),
          400: buildSuccessResponse('Validation error', errorResponseSchema),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete one task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: buildSuccessResponse('Task deleted successfully', {
            allOf: [
              { $ref: '#/components/schemas/ApiResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Task' }
                }
              }
            ]
          }),
          403: buildSuccessResponse('Forbidden', errorResponseSchema)
        }
      }
    }
  }
};

const swaggerUiOptions = {
  customSiteTitle: 'DevBoard API Docs',
  explorer: true
};

module.exports = {
  swaggerUi,
  swaggerUiOptions,
  openApiSpec
};
