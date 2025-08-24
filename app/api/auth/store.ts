import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface User {
  id: string;
  username: string;
  password: string;
  role: "user";
  email: string;
  githubToken?: string;
  // CSE-2: Add user authentication with token validation
  // TODO: Add accessToken and refreshToken fields for Bearer token authentication
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  // CSE-3: Enhance token validation middleware
  // TODO: Add token field to store Bearer tokens alongside session IDs
  // CSE-5: Implement token refresh mechanism - add refreshToken field
}

export const users: User[] = [
  {
    id: "1",
    username: process.env.GITHUB_USERNAME || "user",
    password: "password",
    role: "user",
    email: "user@example.com",
    githubToken: process.env.GITHUB_TOKEN,
  },
];

const SESSION_FILE_PATH = join(process.cwd(), "data", "sessions.json");

function loadSessions(): Session[] {
  try {
    if (existsSync(SESSION_FILE_PATH)) {
      const data = readFileSync(SESSION_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading sessions:", error);
  }
  return [];
}

function saveSessions(sessions: Session[]): void {
  try {
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      require("fs").mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(SESSION_FILE_PATH, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error("Error saving sessions:", error);
  }
}

export function findUser(username: string, password: string): User | undefined {
  // CSE-2: Add user authentication with token validation
  // TODO: Enhance to support token-based authentication in addition to username/password
  return users.find((u) => u.username === username && u.password === password);
}

export function createSession(userId: string): Session {
  // CSE-3: Enhance token validation middleware
  // TODO: Generate JWT or Bearer token in addition to session ID
  const sessionId = Math.random().toString(36).substr(2, 9);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const session: Session = {
    id: sessionId,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function findSession(sessionId: string): Session | undefined {
  // CSE-3: Enhance token validation middleware
  // TODO: Add support for finding sessions by Bearer token, not just session ID
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return undefined;

  // Check if session is expired
  if (new Date() > new Date(session.expiresAt)) {
    removeSession(sessionId);
    return undefined;
  }

  return session;
}

export function removeSession(sessionId: string): void {
  const sessions = loadSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index > -1) {
    sessions.splice(index, 1);
    saveSessions(sessions);
  }
}

export function getUserById(userId: string): User | undefined {
  // CSE-2: Add user authentication with token validation
  // TODO: Enhance to include token validation when retrieving user
  return users.find((u) => u.id === userId);
}
