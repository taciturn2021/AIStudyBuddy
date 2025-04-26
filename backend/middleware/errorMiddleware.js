

const errorHandler = (err, req, res, next) => {
  console.log('--- ERROR HANDLER CALLED ---');
  console.log('Request Path:', req.path);
  console.log('Original Status Code:', res.statusCode);

  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

  console.error(`Error: ${err.message}\nStack: ${process.env.NODE_ENV === 'production' ? null : err.stack}`);

  res.status(statusCode);

  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler }; 