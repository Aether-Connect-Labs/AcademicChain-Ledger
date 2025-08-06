import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AcademicChain Ledger API',
      version: '1.0.0',
      description: 'API para el sistema de credenciales académicas basado en blockchain',
    },
    servers: [
      { url: 'http://localhost:3001/api/v1', description: 'Local server' },
      { url: 'https://api.academicchain.com/api/v1', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/controllers/*.ts', './src/dtos/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: any): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}