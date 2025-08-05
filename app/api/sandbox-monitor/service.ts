import { getAllProjects, updateProject } from "../projects/store";
import { getCodeSandboxService } from "../services/codesandbox";

/**
 * Service to monitor and maintain CodeSandbox sandbox health
 * Automatically restarts out-of-date sandboxes and hibernates them to save resources
 */
class SandboxMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private isRunning = false;

  /**
   * Start the monitoring service
   */
  start() {
    if (this.intervalId || this.isRunning) {
      console.log('Sandbox monitor service is already running');
      return;
    }

    // Validate environment before starting
    if (!process.env.CSB_API_KEY) {
      console.warn('CodeSandbox API key not found, cannot start monitor service');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.checkOutOfDateProjects();
    }, this.CHECK_INTERVAL);

    console.log(`Sandbox monitor service started (checking every ${this.CHECK_INTERVAL / 1000 / 60} minutes)`);
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('Sandbox monitor service stopped');
    }
  }

  /**
   * Get the current status of the monitor service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.CHECK_INTERVAL,
      nextCheckIn: this.intervalId ? this.CHECK_INTERVAL : null
    };
  }

  /**
   * Manually trigger a check for out-of-date projects
   */
  async manualCheck() {
    console.log('Manual sandbox monitor check triggered');
    await this.checkOutOfDateProjects();
  }

  /**
   * Check all projects for out-of-date sandboxes and handle them
   */
  private async checkOutOfDateProjects() {
    try {
      if (!process.env.CSB_API_KEY) {
        console.warn('CodeSandbox API key not found, skipping monitor check');
        return;
      }

      const projects = await getAllProjects();
      
      const outOfDateProjects = projects.filter(project => 
        project.isUpToDate === false || project.isUpToDate === undefined
      );

      console.log(`Monitor check: Found ${outOfDateProjects.length} potentially out-of-date projects out of ${projects.length} total`);

      if (outOfDateProjects.length === 0) {
        return;
      }

      const csbService = getCodeSandboxService();

      // Process projects in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < outOfDateProjects.length; i += batchSize) {
        const batch = outOfDateProjects.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(project => 
            this.handleOutOfDateProject(csbService, project.id, project.sandboxId, project.name)
          )
        );

        // Small delay between batches
        if (i + batchSize < outOfDateProjects.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error in sandbox monitor check:', error);
    }
  }

  /**
   * Handle a single out-of-date project
   */
  private async handleOutOfDateProject(
    csbService: any, 
    projectId: string, 
    sandboxId: string, 
    projectName: string
  ) {
    try {
      console.log(`Checking sandbox ${sandboxId} for project "${projectName}" (${projectId})`);
      
      // Check current status
      const sandbox = await csbService.getSandbox(sandboxId);
      
      if (!sandbox.isUpToDate) {
        console.log(`Restarting out-of-date sandbox ${sandboxId} for project "${projectName}"`);
        
        // Restart the sandbox
        await csbService.restartSandbox(sandboxId);
        
        // Hibernate after restart to save resources
        await csbService.hibernateSandbox(sandboxId);
        
        // Update project status
        await updateProject(projectId, { isUpToDate: true });
        
        console.log(`Successfully restarted and hibernated sandbox ${sandboxId} for "${projectName}"`);
      } else {
        // Update project status if it's now up to date
        await updateProject(projectId, { isUpToDate: true });
        console.log(`Sandbox ${sandboxId} for "${projectName}" is up to date`);
      }
    } catch (error) {
      console.error(`Failed to handle sandbox ${sandboxId} for project "${projectName}":`, error);
      // Don't throw to avoid stopping the entire batch
    }
  }
}

export const sandboxMonitorService = new SandboxMonitorService();