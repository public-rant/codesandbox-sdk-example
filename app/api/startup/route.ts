import { sandboxMonitorService } from "../sandbox-monitor/service";

export async function GET() {
  try {
    // Start the sandbox monitor service
    sandboxMonitorService.start();
    
    return Response.json({ 
      message: 'Application initialized successfully',
      services: ['sandbox-monitor']
    });
  } catch (error) {
    console.error('Error during application startup:', error);
    return Response.json(
      { error: 'Failed to initialize application services' },
      { status: 500 }
    );
  }
}