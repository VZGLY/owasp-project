const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Garage Management API',
      version: '1.0.0',
      description: 'API for managing garage operations including customers, vehicles, services, invoices, and feedback.'
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserRegister: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username',
            },
            password: {
              type: 'string',
              description: 'User\'s password',
            },
            role: {
              type: 'string',
              description: 'User\'s role (default: user)',
              enum: ['user', 'admin'],
            },
          },
          example: {
            username: 'testuser',
            password: 'testpassword',
            role: 'user',
          },
        },
        UserLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'User\'s username',
            },
            password: {
              type: 'string',
              description: 'User\'s password',
            },
          },
          example: {
            username: 'testuser',
            password: 'testpassword',
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            token: {
              type: 'string',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                },
                username: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                },
              },
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
            },
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
            },
          },
          example: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '123-456-7890',
          },
        },
        CustomerInput: {
          type: 'object',
          required: ['first_name', 'last_name', 'email'],
          properties: {
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
            },
          },
          example: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '123-456-7890',
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
            },
            customer_id: {
              type: 'integer',
            },
            make: {
              type: 'string',
            },
            model: {
              type: 'string',
            },
            year: {
              type: 'integer',
            },
            license_plate: {
              type: 'string',
            },
            vin: {
              type: 'string',
            },
            customer_first_name: {
              type: 'string',
              readOnly: true,
            },
            customer_last_name: {
              type: 'string',
              readOnly: true,
            },
          },
          example: {
            id: 1,
            customer_id: 1,
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            license_plate: 'ABC123',
            vin: 'VINTYOYOTA12345',
            customer_first_name: 'Alice',
            customer_last_name: 'Smith',
          },
        },
        VehicleInput: {
          type: 'object',
          required: ['customer_id', 'make', 'model', 'year', 'license_plate'],
          properties: {
            customer_id: {
              type: 'integer',
            },
            make: {
              type: 'string',
            },
            model: {
              type: 'string',
            },
            year: {
              type: 'integer',
            },
            license_plate: {
              type: 'string',
            },
            vin: {
              type: 'string',
            },
          },
          example: {
            customer_id: 1,
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            license_plate: 'ABC123',
            vin: 'VINTYOYOTA12345',
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'number',
              format: 'float',
            },
          },
          example: {
            id: 1,
            name: 'Oil Change',
            description: 'Standard oil and filter replacement',
            price: 59.99,
          },
        },
        ServiceInput: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0, // This implies price should be non-negative, but the application doesn't enforce it.
            },
          },
          example: {
            name: 'Tire Rotation',
            description: 'Rotate tires and check pressure',
            price: 29.99,
          },
        },
        InvoiceItem: {
          type: 'object',
          properties: {
            item_id: {
              type: 'integer',
              readOnly: true,
            },
            service_name: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
            },
            unit_price: {
              type: 'number',
              format: 'float',
            },
          },
          example: {
            item_id: 1,
            service_name: 'Oil Change',
            quantity: 1,
            unit_price: 59.99,
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
            },
            invoice_date: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
            total_amount: {
              type: 'number',
              format: 'float',
            },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'cancelled'],
            },
            customer_id: {
              type: 'integer',
            },
            vehicle_id: {
              type: 'integer',
            },
            customer_first_name: {
              type: 'string',
              readOnly: true,
            },
            customer_last_name: {
              type: 'string',
              readOnly: true,
            },
            vehicle_license_plate: {
              type: 'string',
              readOnly: true,
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/InvoiceItem',
              },
            },
          },
          example: {
            id: 1,
            invoice_date: '2024-01-01T10:00:00Z',
            total_amount: 89.98,
            status: 'paid',
            customer_id: 1,
            vehicle_id: 1,
            customer_first_name: 'Alice',
            customer_last_name: 'Smith',
            vehicle_license_plate: 'ABC123',
            items: [
              {
                item_id: 1,
                service_name: 'Oil Change',
                quantity: 1,
                unit_price: 59.99,
              },
              {
                item_id: 2,
                service_name: 'Tire Rotation',
                quantity: 1,
                unit_price: 29.99,
              },
            ],
          },
        },
        InvoiceInputItem: {
          type: 'object',
          required: ['service_id', 'quantity'],
          properties: {
            service_id: {
              type: 'integer',
            },
            quantity: {
              type: 'integer',
            },
          },
          example: {
            service_id: 1,
            quantity: 1,
          },
        },
        InvoiceInput: {
          type: 'object',
          required: ['customer_id', 'vehicle_id', 'items'],
          properties: {
            customer_id: {
              type: 'integer',
            },
            vehicle_id: {
              type: 'integer',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/InvoiceInputItem',
              },
            },
          },
          example: {
            customer_id: 1,
            vehicle_id: 1,
            items: [
              {
                service_id: 1,
                quantity: 1,
              },
              {
                service_id: 2,
                quantity: 1,
              },
            ],
          },
        },
        InvoiceStatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'cancelled'],
            },
          },
          example: {
            status: 'paid',
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
            },
            customer_id: {
              type: 'integer',
            },
            vehicle_id: {
              type: 'integer',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
            },
            comments: {
              type: 'string',
            },
            feedback_date: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
            },
            customer_first_name: {
              type: 'string',
              readOnly: true,
            },
            customer_last_name: {
              type: 'string',
              readOnly: true,
            },
            vehicle_license_plate: {
              type: 'string',
              readOnly: true,
            },
          },
          example: {
            id: 1,
            customer_id: 1,
            vehicle_id: 1,
            rating: 5,
            comments: 'Excellent service, very satisfied!',
            feedback_date: '2024-01-05T12:00:00Z',
            customer_first_name: 'Alice',
            customer_last_name: 'Smith',
            vehicle_license_plate: 'ABC123',
          },
        },
        FeedbackInput: {
          type: 'object',
          required: ['customer_id', 'vehicle_id', 'rating'],
          properties: {
            customer_id: {
              type: 'integer',
            },
            vehicle_id: {
              type: 'integer',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
            },
            comments: {
              type: 'string',
            },
          },
          example: {
            customer_id: 1,
            vehicle_id: 1,
            rating: 5,
            comments: 'Excellent service, very satisfied!',
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
