/**
 * Standardized API response utilities
 * Provides consistent error handling and response formatting across all endpoints
 */

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export interface ApiSuccess<T = any> {
  data: T;
  message?: string;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string, status: number = 200): Response {
  const response: ApiSuccess<T> = { data };
  if (message) response.message = message;
  
  return Response.json(response, { status });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string, 
  details?: string, 
  status: number = 500,
  code?: string
): Response {
  const response: ApiError = { error };
  if (details) response.details = details;
  if (code) response.code = code;
  
  return Response.json(response, { status });
}

/**
 * Handle and format caught errors consistently
 */
export function handleApiError(error: unknown, context: string): Response {
  console.error(`API Error in ${context}:`, error);
  
  if (error instanceof Error) {
    // Check for specific error types that should return different status codes
    if (error.message.includes('not found')) {
      return createErrorResponse(
        `${context} failed`,
        error.message,
        404,
        'NOT_FOUND'
      );
    }
    
    if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      return createErrorResponse(
        `${context} failed`,
        error.message,
        401,
        'UNAUTHORIZED'
      );
    }
    
    if (error.message.includes('required') || error.message.includes('invalid')) {
      return createErrorResponse(
        `${context} failed`,
        error.message,
        400,
        'BAD_REQUEST'
      );
    }
    
    return createErrorResponse(
      `${context} failed`,
      error.message,
      500,
      'INTERNAL_ERROR'
    );
  }
  
  return createErrorResponse(
    `${context} failed`,
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Validate required request parameters
 */
export function validateRequiredParams(
  params: Record<string, any>, 
  required: string[]
): void {
  const missing = required.filter(param => !params[param] || params[param] === '');
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required parameters: ${missing.join(', ')}`
    );
  }
}