import { NextRequest } from "next/server";
import { sandboxMonitorService } from "./service";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      sandboxMonitorService.start();
      return Response.json({ message: 'Sandbox monitor service started' });
    } else if (action === 'stop') {
      sandboxMonitorService.stop();
      return Response.json({ message: 'Sandbox monitor service stopped' });
    } else {
      return Response.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing sandbox monitor:', error);
    return Response.json(
      { error: 'Failed to manage sandbox monitor service' },
      { status: 500 }
    );
  }
}