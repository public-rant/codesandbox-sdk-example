import { CodeSandbox } from "@codesandbox/sdk";
import { getAllProjects, updateProject } from "../projects/store";

class SandboxMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  start() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      await this.checkOutOfDateProjects();
    }, this.CHECK_INTERVAL);

    console.log('Sandbox monitor service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Sandbox monitor service stopped');
    }
  }

  private async checkOutOfDateProjects() {
    try {
      if (!process.env.CSB_API_KEY) {
        console.warn('CodeSandbox API key not found, skipping monitor check');
        return;
      }

      const sdk = new CodeSandbox(process.env.CSB_API_KEY);
      const projects = await getAllProjects();
      
      const outOfDateProjects = projects.filter(project => 
        project.isUpToDate === false || project.isUpToDate === undefined
      );

      console.log(`Found ${outOfDateProjects.length} potentially out-of-date projects`);

      for (const project of outOfDateProjects) {
        try {
          await this.handleOutOfDateProject(sdk, project.id, project.sandboxId);
        } catch (error) {
          console.error(`Failed to handle out-of-date project ${project.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking out-of-date projects:', error);
    }
  }

  private async handleOutOfDateProject(sdk: CodeSandbox, projectId: string, sandboxId: string) {
    try {
      // Check current status
      const sandbox = await sdk.sandboxes.get(sandboxId);
      
      if (!sandbox.isUpToDate) {
        console.log(`Restarting out-of-date sandbox ${sandboxId} for project ${projectId}`);
        
        // Restart the sandbox
        await sdk.sandboxes.restart(sandboxId);
        
        // Hibernate after restart
        await sdk.sandboxes.hibernate(sandboxId);
        
        // Update project status
        await updateProject(projectId, { isUpToDate: true });
        
        console.log(`Successfully restarted and hibernated sandbox ${sandboxId}`);
      } else {
        // Update project status if it's now up to date
        await updateProject(projectId, { isUpToDate: true });
      }
    } catch (error) {
      console.error(`Failed to handle sandbox ${sandboxId}:`, error);
      throw error;
    }
  }
}

export const sandboxMonitorService = new SandboxMonitorService();