import { NextRequest } from "next/server";
import { sandboxMonitorService } from "./service";
import { createSuccessResponse, createErrorResponse, handleApiError } from "../utils/responses";

/**
 * GET /api/sandbox-monitor
 * Get the current status of the sandbox monitoring service
 */
export async function GET() {
  try {
    const status = sandboxMonitorService.getStatus();
    return createSuccessResponse(status, "Retrieved sandbox monitor status");
  } catch (error) {
    return handleApiError(error, 'Get sandbox monitor status');
  }
}

/**
 * POST /api/sandbox-monitor
 * Control the sandbox monitoring service (start, stop, check)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return createErrorResponse(
        "Action is required", 
        'Valid actions are: "start", "stop", "check"', 
        400, 
        "MISSING_ACTION"
      );
    }

    switch (action) {
      case 'start':
        sandboxMonitorService.start();
        const startStatus = sandboxMonitorService.getStatus();
        return createSuccessResponse(
          startStatus, 
          startStatus.isRunning 
            ? 'Sandbox monitor service started successfully' 
            : 'Sandbox monitor service was already running'
        );

      case 'stop':
        sandboxMonitorService.stop();
        const stopStatus = sandboxMonitorService.getStatus();
        return createSuccessResponse(
          stopStatus, 
          'Sandbox monitor service stopped'
        );

      case 'check':
        await sandboxMonitorService.manualCheck();
        const checkStatus = sandboxMonitorService.getStatus();
        return createSuccessResponse(
          checkStatus, 
          'Manual sandbox check completed'
        );

      default:
        return createErrorResponse(
          "Invalid action", 
          'Valid actions are: "start", "stop", "check"', 
          400, 
          "INVALID_ACTION"
        );
    }
  } catch (error) {
    return handleApiError(error, 'Manage sandbox monitor');
  }
}