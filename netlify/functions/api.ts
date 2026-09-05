import serverless from 'serverless-http';
import app from '../../server/app.ts';

// Serverless function handler for Netlify
export const handler = serverless(app);
