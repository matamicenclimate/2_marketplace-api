export function customError (error: any) {
  return { 
    status: 'ko',
    message: error.message,
    code: error.statusCode || 500,
    stack: error.stack
  }
}