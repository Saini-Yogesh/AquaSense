# AquaSense Frontend

The frontend application for AquaSense water leak detection system built with React.js.

## Directory Structure

```
frontend/
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies and scripts
├── public/               
│   ├── index.html        # Main HTML template
│   └── manifest.json     # Web app manifest file
└── src/
    ├── App.js            # Main application component
    ├── App.css           # Main application styles
    ├── index.js          # Application entry point
    ├── index.css         # Global styles
    ├── InfiniteTable.js  # Component for displaying sensor data
    ├── InfiniteTable.css # Styles for data table
    ├── LeakDetailsPage.js    # Leak details component
    ├── LeakDetailsPage.css   # Leak details styles
    ├── reportWebVitals.js    # Performance monitoring
    ├── setupTests.js         # Test configuration
    └── App.test.js          # App component tests
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the frontend directory with:
```
REACT_APP_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Components

### App.js
The main application component that handles routing and layout.

### InfiniteTable
A table component with infinite scrolling functionality for displaying sensor data efficiently.

Features:
- Virtual scrolling for handling large datasets
- Real-time data updates
- Sortable columns
- Filterable data

### LeakDetailsPage
Detailed view for individual leak incidents.

Features:
- Comprehensive leak information
- Historical data visualization
- Status tracking
- Action logging

## State Management

The application uses React's built-in state management with hooks for:
- User interface state
- Data caching
- Real-time updates
- Filter preferences

## API Integration

The frontend communicates with the backend through RESTful API endpoints:
- GET `/api/sensors` - Fetch sensor data
- GET `/api/leaks` - Fetch leak reports
- POST `/api/alerts` - Create new alerts

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
