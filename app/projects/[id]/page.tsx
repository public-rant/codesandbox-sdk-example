"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "../../hooks/useProject";
import { useSandboxManager } from "../../hooks/useSandboxManager";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { project, loading, error } = useProject(projectId);
  const {
    sandbox,
    sandboxLoading,
    setupState,
    connectToSandboxInstance,
    devServerTask,
    vscodeTask,
    taskLoading,
    vscodeTaskLoading,
    startDevServer,
    restartDevServer,
    stopDevServer,
    startVscode,
    restartVscode,
    stopVscode,
    previewState,
    vscodeState,
    previewContainerRef,
    vscodeContainerRef,
  } = useSandboxManager();

  useEffect(() => {
    if (project?.sandboxId && !sandbox) {
      connectToSandboxInstance(project.id, project.sandboxId);
    }
  }, [project, sandbox, connectToSandboxInstance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">{error}</h3>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
                {project.githubRepoUrl && (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center mt-1"
                  >
                    {project.githubRepoUrl}
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Sandbox Status */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sandbox:</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    sandbox
                      ? "bg-green-400"
                      : sandboxLoading
                        ? "bg-yellow-400"
                        : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm text-gray-900">
                  {sandbox
                    ? "Connected"
                    : sandboxLoading
                      ? "Connecting..."
                      : "Disconnected"}
                </span>
              </div>

              {/* Setup Status */}
              {sandbox && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Setup:</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      setupState.status === "FINISHED"
                        ? "bg-green-400"
                        : setupState.status === "RUNNING"
                          ? "bg-blue-400"
                          : setupState.status === "ERROR"
                            ? "bg-red-400"
                            : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-900 capitalize">
                    {setupState.status === "FINISHED"
                      ? "Complete"
                      : setupState.status === "RUNNING"
                        ? "Running"
                        : setupState.status === "ERROR"
                          ? "Error"
                          : "Not Started"}
                  </span>
                </div>
              )}

              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                ID: {project.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Two Column Layout */}
        {sandbox && (
          <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* VSCode Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Goose Web
                </h2>
                <div className="flex items-center space-x-4">
                  {/* VSCode Task Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Server:</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        vscodeTask.status === "RUNNING"
                          ? "bg-green-400"
                          : vscodeTask.status === "ERROR"
                            ? "bg-red-400"
                            : vscodeTask.status === "STOPPED"
                              ? "bg-gray-400"
                              : vscodeTask.status === "LOADING"
                                ? "bg-blue-400"
                                : "bg-yellow-400"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-900 capitalize">
                      {vscodeTask.status === "LOADING"
                        ? "Loading..."
                        : vscodeTask.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* VSCode Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Port 8080:
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          vscodeTask.portActive ? "bg-green-400" : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-900">
                        {vscodeTask.portActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {!vscodeTask.portActive ? (
                      <button
                        onClick={startVscode}
                        disabled={
                          vscodeTaskLoading || setupState.status === "RUNNING"
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          setupState.status === "RUNNING"
                            ? "Setup is running, please wait..."
                            : ""
                        }
                      >
                        {vscodeTaskLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M12 4l6 8H6l6-8z"
                            />
                          </svg>
                        )}
                        {setupState.status === "RUNNING"
                          ? "Waiting for Setup..."
                          : "Start VSCode"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={restartVscode}
                          disabled={
                            vscodeTaskLoading || setupState.status === "RUNNING"
                          }
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            setupState.status === "RUNNING"
                              ? "Setup is running, please wait..."
                              : ""
                          }
                        >
                          {vscodeTaskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          Restart
                        </button>
                        <button
                          onClick={stopVscode}
                          disabled={
                            vscodeTaskLoading || setupState.status === "RUNNING"
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            setupState.status === "RUNNING"
                              ? "Setup is running, please wait..."
                              : ""
                          }
                        >
                          {vscodeTaskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 10h6v4H9z"
                              />
                            </svg>
                          )}
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex-1">
                <div
                  ref={vscodeContainerRef}
                  className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Loading state */}
                  {vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">Loading VSCode...</p>
                      </div>
                    </div>
                  )}

                  {/* Port closed message */}
                  {vscodeState.portClosed && !vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 text-orange-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Port Disconnected
                        </h3>
                        <p className="text-gray-600">
                          The VSCode server port has closed.
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          VSCode will reload automatically when the port
                          reopens.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Setup running */}
                  {setupState.status === "RUNNING" && !vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Setting up Sandbox
                        </h3>
                        <p className="text-gray-600">
                          Please wait while the sandbox is being configured...
                        </p>
                        {setupState.currentStepName && (
                          <p className="text-sm text-gray-500 mt-2">
                            Current step: {setupState.currentStepName}
                          </p>
                        )}
                        {setupState.totalSteps > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Step {setupState.currentStepIndex + 1} of{" "}
                            {setupState.totalSteps}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VSCode initial loading state */}
                  {vscodeTask.status === "LOADING" && !vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Checking VSCode Status
                        </h3>
                        <p className="text-gray-600">
                          Please wait while we check the VSCode server status...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VSCode task not running */}
                  {setupState.status !== "RUNNING" &&
                    !vscodeTask.portActive &&
                    !vscodeState.loading &&
                    !vscodeState.portClosed &&
                    vscodeTask.status !== "LOADING" && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No VSCode Available
                          </h3>
                          <p className="text-gray-600">
                            Start the VSCode server to access the editor.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Development Preview Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Development Preview
                </h2>
                <div className="flex items-center space-x-4">
                  {/* Dev Server Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Server:</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        devServerTask.status === "RUNNING"
                          ? "bg-green-400"
                          : devServerTask.status === "ERROR"
                            ? "bg-red-400"
                            : devServerTask.status === "STOPPED"
                              ? "bg-gray-400"
                              : "bg-yellow-400"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-900 capitalize">
                      {devServerTask.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dev Server Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Port 5173:
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          devServerTask.portActive
                            ? "bg-green-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-900">
                        {devServerTask.portActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {!devServerTask.portActive ? (
                      <button
                        onClick={startDevServer}
                        disabled={
                          taskLoading || setupState.status === "RUNNING"
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          setupState.status === "RUNNING"
                            ? "Setup is running, please wait..."
                            : ""
                        }
                      >
                        {taskLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M12 4l6 8H6l6-8z"
                            />
                          </svg>
                        )}
                        {setupState.status === "RUNNING"
                          ? "Waiting for Setup..."
                          : "Start Dev Server"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={restartDevServer}
                          disabled={
                            taskLoading || setupState.status === "RUNNING"
                          }
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            setupState.status === "RUNNING"
                              ? "Setup is running, please wait..."
                              : ""
                          }
                        >
                          {taskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          Restart
                        </button>
                        <button
                          onClick={stopDevServer}
                          disabled={
                            taskLoading || setupState.status === "RUNNING"
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            setupState.status === "RUNNING"
                              ? "Setup is running, please wait..."
                              : ""
                          }
                        >
                          {taskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 10h6v4H9z"
                              />
                            </svg>
                          )}
                          Stop
                        </button>
                        {previewState.connected && previewState.preview && (
                          <button
                            onClick={() => {
                              if (previewState.preview?.iframe && sandbox) {
                                const currentSrc =
                                  previewState.preview.iframe.src;
                                previewState.preview.iframe.src = "";
                                setTimeout(() => {
                                  previewState.preview.iframe.src = currentSrc;
                                }, 10);
                              }
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Reload Preview
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex-1">
                <div
                  ref={previewContainerRef}
                  className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Loading state */}
                  {previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Port closed message */}
                  {previewState.portClosed && !previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 text-orange-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Port Disconnected
                        </h3>
                        <p className="text-gray-600">
                          The development server port has closed.
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Preview will reload automatically when the port
                          reopens.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Setup running */}
                  {setupState.status === "RUNNING" && !previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Setting up Sandbox
                        </h3>
                        <p className="text-gray-600">
                          Please wait while the sandbox is being configured...
                        </p>
                        {setupState.currentStepName && (
                          <p className="text-sm text-gray-500 mt-2">
                            Current step: {setupState.currentStepName}
                          </p>
                        )}
                        {setupState.totalSteps > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Step {setupState.currentStepIndex + 1} of{" "}
                            {setupState.totalSteps}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dev server not running */}
                  {setupState.status !== "RUNNING" &&
                    !devServerTask.portActive &&
                    !previewState.loading &&
                    !previewState.portClosed && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Preview Available
                          </h3>
                          <p className="text-gray-600">
                            Start the development server to see a preview.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
