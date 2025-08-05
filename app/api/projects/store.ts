import { HostToken } from '@codesandbox/sdk';
import { promises as fs } from 'fs';
import path from 'path';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId: string;
  githubRepoUrl?: string;
  hostToken: HostToken;
  isUpToDate?: boolean;
}

interface StoreData {
  projects: Project[];
  nextId: number;
}

const STORE_FILE = path.join(process.cwd(), 'data', 'projects.json');

async function ensureDataDir(): Promise<void> {
  const dataDir = path.dirname(STORE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadStore(): Promise<StoreData> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(STORE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [], nextId: 1 };
  }
}

async function saveStore(data: StoreData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2));
}

export async function addProject(name: string, sandboxId: string, hostToken: HostToken, githubRepoUrl?: string): Promise<Project> {
  const store = await loadStore();
  
  const project: Project = {
    id: store.nextId.toString(),
    name,
    createdAt: new Date().toISOString(),
    sandboxId,
    githubRepoUrl,
    hostToken,
    isUpToDate: true
  };

  store.projects.push(project);
  store.nextId++;
  
  await saveStore(store);
  return project;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const store = await loadStore();
  return store.projects.find(p => p.id === id);
}

export async function getAllProjects(): Promise<Project[]> {
  const store = await loadStore();
  return store.projects;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
  const store = await loadStore();
  const projectIndex = store.projects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    return undefined;
  }
  
  store.projects[projectIndex] = { ...store.projects[projectIndex], ...updates };
  await saveStore(store);
  return store.projects[projectIndex];
}