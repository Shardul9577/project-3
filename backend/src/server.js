// Load .env first so process.env is set before any other imports
import './loadEnv.js';
import app from './app.js';
import connectDB from './utils/connect.db.js';

const PORT = process.env.PORT;

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
