"use client";

import { useState, useCallback, useEffect } from "react";
import { useSandboxContext } from "../contexts/SandboxContext";

interface TaskState {
  status: "RUNNING" | "FINISHED" | "ERROR" | "STOPPED" | "UNKNOWN" | "LOADING";
  portActive: boolean;
}

interface UseSandboxTasksReturn {
  devServerTask: TaskState;
  vscodeTask: TaskState;
  vscodeCommand: any;
  taskLoading: boolean;
  vscodeTaskLoading: boolean;
  checkDevServerStatus: () => Promise<void>;
  checkVscodeStatus: () => Promise<void>;
  startDevServer: () => Promise<void>;
  restartDevServer: () => Promise<void>;
  stopDevServer: () => Promise<void>;
  startVscode: () => Promise<void>;
  restartVscode: () => Promise<void>;
  stopVscode: () => Promise<void>;
}

export function useSandboxTasks(): UseSandboxTasksReturn {
  const { sandbox, setupState, onPortOpen, onPortClose } = useSandboxContext();

  const [devServerTask, setDevServerTask] = useState<TaskState>({
    status: "UNKNOWN",
    portActive: false,
  });
  const [vscodeTask, setVscodeTask] = useState<TaskState>({
    status: "LOADING",
    portActive: false,
  });
  const [vscodeCommand, setVscodeCommand] = useState<any>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [vscodeTaskLoading, setVscodeTaskLoading] = useState(false);

  const setupFinished = setupState.status === "FINISHED";

  const findExistingVscodeCommand = useCallback(async () => {
    if (!sandbox) return null;

    try {
      console.log("🔍 Looking for existing VSCode commands...");
      const allCommands = await sandbox.commands.getAll();
      console.log("📋 All commands:", allCommands);

      const vscodeCmd = allCommands.find(
        (cmd: any) =>
          cmd.command &&
          cmd.command.includes("goose") &&
          cmd.command.includes("4667"),
      );

      if (vscodeCmd) {
        console.log("✅ Found existing VSCode command:", vscodeCmd);
        return vscodeCmd;
      } else {
        console.log("❌ No existing VSCode command found");
        return null;
      }
    } catch (err) {
      console.error("💥 Failed to get commands:", err);
      return null;
    }
  }, [sandbox]);

  const checkDevServerStatus = useCallback(async () => {
    if (!sandbox) return;

    try {
      console.log("🔍 Checking dev server status...");
      const tasks = await sandbox.tasks.getAll();
      console.log("📋 All tasks:", tasks);

      const devTask = tasks.find((task: any) => task.id === "dev-server");
      console.log("🎯 Found dev-server task:", devTask);

      if (devTask) {
        console.log("📊 Task status:", devTask.status);

        let portActive = false;
        try {
          console.log("🔌 Checking port availability...");
          const portResult = await Promise.race([
            devTask.waitForPort(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 2000),
            ),
          ]);
          console.log("✅ Port check result:", portResult);
          portActive = true;
        } catch (portError) {
          console.log(
            "❌ Port check failed:",
            portError instanceof Error ? portError.message : "Unknown error",
          );
          portActive = false;
        }

        console.log("📈 Final task state:", {
          status: devTask.status,
          portActive,
        });
        setDevServerTask({
          status: devTask.status || "UNKNOWN",
          portActive,
        });
      } else {
        console.log("❌ No dev-server task found");
        setDevServerTask({ status: "UNKNOWN", portActive: false });
      }
    } catch (err) {
      console.error("💥 Failed to check dev server status:", err);
      setDevServerTask({ status: "ERROR", portActive: false });
    }
  }, [sandbox]);

  const checkVscodeStatus = useCallback(async () => {
    if (!sandbox) return;

    try {
      console.log("🔍 Checking VSCode port status...");

      let portActive = false;
      try {
        console.log("🔌 Checking port 8080 availability...");
        const portResult = await Promise.race([
          sandbox.ports.waitForPort(8080),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 2000),
          ),
        ]);
        console.log("✅ Port 8080 check result:", portResult);
        portActive = true;
      } catch (portError) {
        console.log(
          "❌ Port 8080 check failed:",
          portError instanceof Error ? portError.message : "Unknown error",
        );
        portActive = false;
      }

      console.log("📈 VSCode port state:", { portActive });
      setVscodeTask({
        status: portActive ? "RUNNING" : "STOPPED",
        portActive,
      });

      if (portActive && !vscodeCommand) {
        console.log(
          "🔍 Port is active but no command reference, looking for existing command...",
        );
        const existingCommand = await findExistingVscodeCommand();
        if (existingCommand) {
          setVscodeCommand(existingCommand);
          console.log("✅ Found and stored existing VSCode command reference");
        }
      }
    } catch (err) {
      console.error("💥 Failed to check VSCode port status:", err);
      setVscodeTask({ status: "ERROR", portActive: false });
    }
  }, [sandbox, vscodeCommand, findExistingVscodeCommand]);

  // Set up port event listeners
  useEffect(() => {
    if (!sandbox) return;

    // Listen for port events from the context
    const cleanupPortOpen = onPortOpen((portInfo: any) => {
      if (portInfo.port === 5173) {
        console.log("✅ Dev server port 5173 opened");
        checkDevServerStatus();
      } else if (portInfo.port === 8080) {
        console.log("✅ VSCode port 8080 opened");
        checkVscodeStatus();
      }
    });

    const cleanupPortClose = onPortClose((port: number) => {
      if (port === 5173) {
        console.log("❌ Dev server port 5173 closed");
        checkDevServerStatus();
      } else if (port === 8080) {
        console.log("❌ VSCode port 8080 closed");
        checkVscodeStatus();
      }
    });

    // Initial status checks
    checkDevServerStatus();
    checkVscodeStatus();

    return () => {
      cleanupPortOpen();
      cleanupPortClose();
    };
  }, [
    sandbox,
    onPortOpen,
    onPortClose,
    checkDevServerStatus,
    checkVscodeStatus,
  ]);

  const startDevServer = useCallback(async () => {
    if (!sandbox || !setupFinished) {
      console.log("❌ Cannot start dev server: setup is still running");
      return;
    }

    console.log("🚀 Starting dev server...");
    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === "dev-server");
      console.log("🎯 Task to start:", devTask);

      if (devTask) {
        console.log("▶️ Running task...");
        await devTask.run();
        console.log("✅ Task started, checking status...");
        await checkDevServerStatus();
      } else {
        console.log("❌ No dev-server task found to start");
      }
    } catch (err) {
      console.error("💥 Failed to start dev server:", err);
    } finally {
      setTaskLoading(false);
    }
  }, [sandbox, setupFinished, checkDevServerStatus]);

  const restartDevServer = useCallback(async () => {
    if (!sandbox || !setupFinished) {
      console.log("❌ Cannot restart dev server: setup is still running");
      return;
    }

    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === "dev-server");

      if (devTask) {
        await devTask.restart();
        await checkDevServerStatus();
      }
    } catch (err) {
      console.error("Failed to restart dev server:", err);
    } finally {
      setTaskLoading(false);
    }
  }, [sandbox, setupFinished, checkDevServerStatus]);

  const stopDevServer = useCallback(async () => {
    if (!sandbox || !setupFinished) {
      console.log("❌ Cannot stop dev server: setup is still running");
      return;
    }

    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === "dev-server");

      if (devTask) {
        await devTask.stop();
        await checkDevServerStatus();
      }
    } catch (err) {
      console.error("Failed to stop dev server:", err);
    } finally {
      setTaskLoading(false);
    }
  }, [sandbox, setupFinished, checkDevServerStatus]);

  const startVscode = useCallback(async () => {
    if (!sandbox) return;

    console.log("🚀 Starting VSCode server...");
    setVscodeTaskLoading(true);
    try {
      let portAlreadyOpen = false;
      try {
        console.log("🔍 Checking if port 8080 is already open...");
        await Promise.race([
          sandbox.ports.waitForPort(8080),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 1000),
          ),
        ]);
        portAlreadyOpen = true;
        console.log("✅ Port 8080 is already open, skipping command execution");
      } catch (portError) {
        console.log("📝 Port 8080 is not open, will start VSCode server");
        portAlreadyOpen = false;
      }

      if (!portAlreadyOpen) {
        console.log("▶️ Running code-server command...");
        const command =
          "code-server /project/workspace/app --host 0.0.0.0 --port 8080 --auth none --disable-telemetry --user-data-dir /project/workspace/.vscode";
        const cmdInstance = await sandbox.commands.runBackground(command, {
          name: "VSCode Server",
        });
        setVscodeCommand(cmdInstance);
        console.log("✅ Code-server command started");

        console.log("⏳ Waiting for port 8080 to open...");
        try {
          await sandbox.ports.waitForPort(8080);
          console.log("✅ Port 8080 is now open");
        } catch (waitError) {
          console.error("❌ Timeout waiting for port 8080:", waitError);
        }
      }

      await checkVscodeStatus();
    } catch (err) {
      console.error("💥 Failed to start VSCode server:", err);
    } finally {
      setVscodeTaskLoading(false);
    }
  }, [sandbox, checkVscodeStatus]);

  const restartVscode = useCallback(async () => {
    if (!sandbox || !setupFinished) {
      console.log("❌ Cannot restart VSCode: setup is still running");
      return;
    }

    setVscodeTaskLoading(true);
    try {
      console.log("🔄 Restarting VSCode server...");

      const existingCommand =
        vscodeCommand || (await findExistingVscodeCommand());
      if (existingCommand) {
        console.log("🛑 Stopping existing VSCode command...");
        try {
          await existingCommand.kill();
          console.log("✅ VSCode command stopped");
        } catch (killError) {
          console.log(
            "⚠️ Error stopping VSCode command, will continue:",
            killError,
          );
        }
      } else {
        console.log("ℹ️ No existing VSCode command found to stop");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("▶️ Starting code-server command...");
      const command =
        "code-server /project/workspace/app --host 0.0.0.0 --port 8080 --auth none --disable-telemetry --user-data-dir /project/workspace/.vscode";
      const cmdInstance = await sandbox.commands.runBackground(command, {
        name: "VSCode Server",
      });
      setVscodeCommand(cmdInstance);
      console.log("✅ Code-server command restarted");

      console.log("⏳ Waiting for port 8080 to open...");
      try {
        await sandbox.ports.waitForPort(8080);
        console.log("✅ Port 8080 is now open");
      } catch (waitError) {
        console.error("❌ Timeout waiting for port 8080:", waitError);
      }

      await checkVscodeStatus();
    } catch (err) {
      console.error("💥 Failed to restart VSCode:", err);
    } finally {
      setVscodeTaskLoading(false);
    }
  }, [
    sandbox,
    setupFinished,
    vscodeCommand,
    findExistingVscodeCommand,
    checkVscodeStatus,
  ]);

  const stopVscode = useCallback(async () => {
    if (!sandbox || !setupFinished) {
      console.log("❌ Cannot stop VSCode: setup is still running");
      return;
    }

    setVscodeTaskLoading(true);
    try {
      console.log("🛑 Stopping VSCode server...");

      const existingCommand =
        vscodeCommand || (await findExistingVscodeCommand());
      if (existingCommand) {
        console.log("🛑 Killing VSCode command...");
        try {
          await existingCommand.kill();
          setVscodeCommand(null);
          console.log("✅ VSCode command stopped");
        } catch (killError) {
          console.log("⚠️ Error stopping VSCode command:", killError);
        }
      } else {
        console.log("ℹ️ No VSCode command found to stop");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await checkVscodeStatus();
    } catch (err) {
      console.error("💥 Failed to stop VSCode:", err);
    } finally {
      setVscodeTaskLoading(false);
    }
  }, [
    sandbox,
    setupFinished,
    vscodeCommand,
    findExistingVscodeCommand,
    checkVscodeStatus,
  ]);

  return {
    devServerTask,
    vscodeTask,
    vscodeCommand,
    taskLoading,
    vscodeTaskLoading,
    checkDevServerStatus,
    checkVscodeStatus,
    startDevServer,
    restartDevServer,
    stopDevServer,
    startVscode,
    restartVscode,
    stopVscode,
  };
}
