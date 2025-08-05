import { CodeSandbox, HostToken } from '@codesandbox/sdk';

/**
 * Centralized CodeSandbox SDK service
 * Handles all CodeSandbox API interactions with consistent error handling and configuration
 */
export class CodeSandboxService {
  private sdk: CodeSandbox;
  private static instance: CodeSandboxService;

  private constructor(apiKey: string) {
    this.sdk = new CodeSandbox(apiKey);
  }

  /**
   * Get singleton instance of CodeSandboxService
   * Ensures consistent SDK configuration across the application
   */
  static getInstance(): CodeSandboxService {
    if (!process.env.CSB_API_KEY) {
      throw new Error('CSB_API_KEY environment variable is required');
    }

    if (!CodeSandboxService.instance) {
      CodeSandboxService.instance = new CodeSandboxService(process.env.CSB_API_KEY);
    }

    return CodeSandboxService.instance;
  }

  /**
   * Create a new sandbox from template
   */
  async createSandbox(templateId: string = 'sdk-example@latest', privacy: 'public' | 'private' = 'private') {
    try {
      return await this.sdk.sandboxes.create({
        id: templateId,
        privacy,
      });
    } catch (error) {
      throw new Error(`Failed to create sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sandbox information
   */
  async getSandbox(sandboxId: string) {
    try {
      // Note: Using any type as the SDK types may not be perfectly aligned
      return await (this.sdk.sandboxes as any).get(sandboxId);
    } catch (error) {
      throw new Error(`Failed to get sandbox ${sandboxId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resume a hibernated sandbox
   */
  async resumeSandbox(sandboxId: string) {
    try {
      return await this.sdk.sandboxes.resume(sandboxId);
    } catch (error) {
      throw new Error(`Failed to resume sandbox ${sandboxId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restart a sandbox
   */
  async restartSandbox(sandboxId: string) {
    try {
      return await this.sdk.sandboxes.restart(sandboxId);
    } catch (error) {
      throw new Error(`Failed to restart sandbox ${sandboxId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hibernate a sandbox to save resources
   */
  async hibernateSandbox(sandboxId: string) {
    try {
      return await this.sdk.sandboxes.hibernate(sandboxId);
    } catch (error) {
      throw new Error(`Failed to hibernate sandbox ${sandboxId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a host token for sandbox access
   */
  async createHostToken(sandboxId: string, expirationYears: number = 10): Promise<HostToken> {
    try {
      const expiresAt = new Date(Date.now() + expirationYears * 365 * 24 * 60 * 60 * 1000);
      return await this.sdk.hosts.createToken(sandboxId, { expiresAt });
    } catch (error) {
      throw new Error(`Failed to create host token for sandbox ${sandboxId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to a sandbox and return a client
   */
  async connectToSandbox(sandbox: any, userConfig: {
    id: string;
    email: string;
    username: string;
    githubToken: string;
  }) {
    try {
      return await sandbox.connect({
        id: userConfig.id,
        git: {
          email: userConfig.email,
          username: userConfig.username,
          provider: "github.com",
          accessToken: userConfig.githubToken,
        },
      });
    } catch (error) {
      throw new Error(`Failed to connect to sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a browser session for a sandbox
   */
  async createSandboxSession(sandbox: any, userConfig: {
    id: string;
    email: string;
    username: string;
    githubToken: string;
  }, hostToken: HostToken) {
    try {
      return await sandbox.createSession({
        id: userConfig.id,
        git: {
          email: userConfig.email,
          username: userConfig.username,
          provider: "github.com",
          accessToken: userConfig.githubToken,
        },
        hostToken,
      });
    } catch (error) {
      throw new Error(`Failed to create sandbox session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Convenience function to get CodeSandbox service instance
 */
export function getCodeSandboxService(): CodeSandboxService {
  return CodeSandboxService.getInstance();
}