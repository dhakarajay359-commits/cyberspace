import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

const SANDBOX_IMAGE = process.env.SANDBOX_IMAGE || 'linux-terminal-sandbox';
const CONTAINER_MEMORY = process.env.CONTAINER_MEMORY || '256m';
const CONTAINER_CPUS = process.env.CONTAINER_CPUS || '0.5';
const CONTAINER_TIMEOUT = parseInt(process.env.CONTAINER_TIMEOUT || '1800', 10); // 30 min

export interface ContainerInfo {
  id: string;
  name: string;
  createdAt: Date;
}

/**
 * Start a new isolated Docker Ubuntu container for a terminal session.
 */
export async function createContainer(sessionId: string): Promise<ContainerInfo> {
  const name = `terminal-${sessionId.substring(0, 8)}`;

  const args = [
    'run', '-d',
    '--name', name,
    '--rm',
    '--interactive',
    '--tty',
    `--memory=${CONTAINER_MEMORY}`,
    `--memory-swap=${CONTAINER_MEMORY}`,
    `--cpus=${CONTAINER_CPUS}`,
    '--pids-limit=100',
    '--security-opt=no-new-privileges',
    '--cap-drop=ALL',
    '--cap-add=CHOWN',
    '--cap-add=SETUID',
    '--cap-add=SETGID',
    '--cap-add=DAC_OVERRIDE',
    '--network=bridge',          // allow outbound curl/wget
    '--hostname=kali',
    '--workdir=/home/user',
    '--user=user',
    SANDBOX_IMAGE,
    '/bin/bash',
  ];

  const { stdout, stderr } = await execAsync(`docker ${args.join(' ')}`);
  if (stderr && !stderr.includes('WARNING')) {
    throw new Error(`Docker error: ${stderr}`);
  }

  const containerId = stdout.trim();
  console.log(`[Docker] Container started: ${name} (${containerId.substring(0, 12)})`);

  return {
    id: containerId,
    name,
    createdAt: new Date(),
  };
}

/**
 * Stop and remove a container.
 */
export async function destroyContainer(containerId: string): Promise<void> {
  try {
    await execAsync(`docker stop ${containerId} --time 5`);
    console.log(`[Docker] Container stopped: ${containerId.substring(0, 12)}`);
  } catch (e) {
    // Container may already be stopped
  }
}

/**
 * Check if a container is still running.
 */
export async function isContainerRunning(containerId: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `docker inspect -f "{{.State.Running}}" ${containerId}`
    );
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Copy a file INTO a container.
 */
export async function copyFileToContainer(
  containerId: string,
  localPath: string,
  containerPath: string
): Promise<void> {
  await execAsync(`docker cp "${localPath}" "${containerId}:${containerPath}"`);
}

/**
 * Copy a file OUT of a container to a local temp path.
 */
export async function copyFileFromContainer(
  containerId: string,
  containerPath: string,
  localPath: string
): Promise<void> {
  await execAsync(`docker cp "${containerId}:${containerPath}" "${localPath}"`);
}

/**
 * Execute a command inside a container and return stdout.
 */
export async function execInContainer(
  containerId: string,
  command: string
): Promise<string> {
  const { stdout } = await execAsync(
    `docker exec ${containerId} /bin/bash -c "${command.replace(/"/g, '\\"')}"`
  );
  return stdout;
}

/**
 * Returns the shell path to exec into (bash inside the container).
 * Used by node-pty to attach an interactive PTY.
 */
export function getExecCommand(containerId: string): { file: string; args: string[] } {
  return {
    file: 'docker',
    args: [
      'exec', '-it',
      '--env', 'TERM=xterm-256color',
      containerId,
      '/bin/bash',
      '--login',
    ],
  };
}
