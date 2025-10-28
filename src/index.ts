#!/usr/bin/env node

/* eslint-disable no-console */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as http from 'http';
import { createWriteStream, existsSync } from 'fs';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { Extract } from 'unzipper';

interface Task {
  name: string;
  zipUrl: string;
  unzipPath: string;
  crc64?: string;
  auth?: string;
  clean?: boolean;
}

interface Config {
  'code-sync'?: Task[];
}

/**
 * Replace environment variables in string
 * Supports ${VAR_NAME} or $VAR_NAME format
 */
function replaceEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi, (match, p1, p2) => {
    const varName = p1 || p2;
    return process.env[varName] || match;
  });
}

/**
 * Calculate file checksum (using MD5)
 */
async function calculateCRC64(filePath: string): Promise<string> {
  // Using MD5 as checksum (CRC64 is not a standard library in Node.js)
  // For real CRC64, you need to introduce additional libraries
  const fileBuffer = await fs.readFile(filePath);
  const hash = createHash('md5');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Download file
 */
async function downloadFile(url: string, destPath: string, auth?: string): Promise<void> {
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  
  const options = {
    headers: auth ? { Authorization: replaceEnvVars(auth) } : {},
  };

  return new Promise((resolve, reject) => {
    protocol.get(url, options, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        if (response.headers.location) {
          downloadFile(response.headers.location, destPath, auth)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status code: ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath).catch(() => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Extract ZIP file
 */
async function unzipFile(zipPath: string, destPath: string): Promise<void> {
  await fs.mkdir(destPath, { recursive: true });
  const readStream = (await import('fs')).createReadStream(zipPath);
  await pipeline(readStream, Extract({ path: destPath }));
}

/**
 * Clean directory
 */
async function cleanDirectory(dirPath: string): Promise<void> {
  if (existsSync(dirPath)) {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}

/**
 * Process a single task
 */
async function processTask(task: Task): Promise<void> {
  console.log(`\n[Task: ${task.name}] Starting...`);
  console.log(`  URL: ${task.zipUrl}`);
  console.log(`  Destination: ${task.unzipPath}`);

  const tempDir = path.join(os.tmpdir(), 'code-sync');
  await fs.mkdir(tempDir, { recursive: true });

  const zipFileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`;
  const zipPath = path.join(tempDir, zipFileName);

  try {
    // Download file
    console.log('  Downloading...');
    await downloadFile(task.zipUrl, zipPath, task.auth);
    console.log('  Downloaded');

    // Verify checksum
    if (task.crc64) {
      console.log('  Verifying checksum...');
      const calculatedHash = await calculateCRC64(zipPath);
      if (calculatedHash !== task.crc64) {
        throw new Error(`Checksum verification failed! Expected: ${task.crc64}, Got: ${calculatedHash}`);
      }
      console.log('  Checksum verified');
    }

    // Clean target directory
    if (task.clean) {
      console.log('  Cleaning target directory...');
      await cleanDirectory(task.unzipPath);
      console.log('  Cleaned');
    }

    // Extract file
    console.log('  Extracting...');
    await unzipFile(zipPath, task.unzipPath);
    console.log('  Extracted');

    console.log(`[Task: ${task.name}] Completed ✓`);
  } catch (error) {
    console.error(`[Task: ${task.name}] Failed ✗`);
    throw error;
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(zipPath);
    } catch {
      // Ignore deletion errors
    }
  }
}

/**
 * Load configuration
 */
async function loadConfig(): Promise<Task[]> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const config: Config = JSON.parse(content);
    
    if (!config['code-sync'] || !Array.isArray(config['code-sync'])) {
      throw new Error('code-sync configuration not found in package.json or format is incorrect');
    }

    return config['code-sync'];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`package.json not found: ${packageJsonPath}`);
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const targetTaskName = process.argv[2];
  
  console.log('Code Sync Tool\n');

  try {
    // Load configuration
    const allTasks = await loadConfig();
    
    // Filter tasks if a specific task name is provided
    let tasks: Task[];
    if (targetTaskName) {
      tasks = allTasks.filter(task => task.name === targetTaskName);
      if (tasks.length === 0) {
        throw new Error(`Task "${targetTaskName}" not found in configuration`);
      }
      console.log(`Running task: ${targetTaskName}\n`);
    } else {
      tasks = allTasks;
      console.log(`Running ${tasks.length} tasks\n`);
    }

    // Process tasks in order
    for (const task of tasks) {
      await processTask(task);
    }

    console.log('\nAll tasks completed!');
  } catch (error) {
    console.error('\nError:', (error as Error).message);
    process.exit(1);
  }
}

// Run main function
main();
