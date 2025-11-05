# AquaSense Backend

Node.js backend server for the AquaSense water leak detection system.

## Directory Structure

```
backend/
├── .env                 # Environment variables configuration
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies and scripts
├── server.js          # Main server application file
├── models/            
│   └── SensorData.js   # Database model for sensor data
└── routes/
    └── sensorRoutes.js # API route definitions
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the backend directory with:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/aquasense
```

3. Start the server:
```bash
npm start
```

The server will be running at `http://localhost:3000`

## API Endpoints

### Sensor Data

#### GET `/api/sensors`
- Fetch sensor data with pagination
- Query Parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `sort`: Sort field (default: timestamp)
  - `order`: Sort order (asc/desc)

#### POST `/api/sensors`
- Add new sensor reading
- Required fields:
  - `sensorId`: Unique sensor identifier
  - `reading`: Sensor reading value
  - `timestamp`: Reading timestamp

### Leaks

#### GET `/api/leaks`
- Fetch detected leaks
- Query Parameters:
  - `status`: Filter by leak status
  - `severity`: Filter by severity level

#### POST `/api/leaks`
- Report new leak
- Required fields:
  - `location`: Leak location
  - `severity`: Leak severity
  - `description`: Leak description

## Database Schema

### SensorData Model

```javascript
{
  sensorId: String,
  reading: Number,
  timestamp: Date,
  location: String,
  status: String,
  metadata: Object
}
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security

- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting for API endpoints
- CORS configuration

## Scripts

- `npm start`: Start the server
- `npm run dev`: Start with nodemon for development
- `npm test`: Run tests
- `npm run lint`: Run ESLint

## Monitoring

The server includes:
- Request logging
- Error tracking
- Performance monitoring
- API usage statistics

## Contributing

1. Follow the project's coding standards
2. Write meaningful commit messages
3. Include appropriate tests
4. Document API changes

## Troubleshooting

Common issues and solutions:

1. **MongoDB Connection Issues**
   - Check if MongoDB is running
   - Verify MONGODB_URI in `.env`
   - Check network connectivity

2. **API Errors**
   - Check request format and data types
   - Verify authentication tokens
   - Review server logs

3. **Performance Issues**
   - Monitor database queries
   - Check server resources
   - Review connection pooling settings