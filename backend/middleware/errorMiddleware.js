

const errorHandler = (err, req, res, next) => {
  console.log('--- ERROR HANDLER CALLED ---');
  console.log('Request Path:', req.path);
  console.log('Original Status Code:', res.statusCode);

  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

  // Log the full error for server-side debugging
  console.error(`Error: ${err.message}\nStack: ${err.stack}`);

  // In production, send minimal error information to client
  const isProd = process.env.NODE_ENV === 'production';
  
  res.status(statusCode);

  res.json({
    success: false,
    message: isProd && statusCode === 500 ? 'Server error occurred' : err.message,
    // Never send stack traces to the client in production
    stack: isProd ? null : err.stack,
  });
};

module.exports = { errorHandler }; 