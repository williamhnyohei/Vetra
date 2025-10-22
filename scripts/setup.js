#!/usr/bin/env node

/**
 * Vetra Setup Script
 * Automates the initial setup process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.cyan + colors.bright);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function exec(command, options = {}) {
  try {
    execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    return true;
  } catch (error) {
    return false;
  }
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    logSuccess(`${name} is installed`);
    return true;
  } catch (error) {
    logError(`${name} is not installed`);
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function copyEnvExample(dir, name) {
  const envExample = path.join(dir, '.env.example');
  const envFile = path.join(dir, '.env');

  if (fileExists(envExample) && !fileExists(envFile)) {
    fs.copyFileSync(envExample, envFile);
    logSuccess(`Created ${name}/.env`);
  } else if (fileExists(envFile)) {
    logWarning(`${name}/.env already exists, skipping`);
  }
}

async function main() {
  log('\n🚀 Vetra Setup Script', colors.cyan + colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Check prerequisites
  logStep(1, 'Checking Prerequisites');
  
  const hasNode = checkCommand('node', 'Node.js');
  const hasPnpm = checkCommand('pnpm', 'pnpm');
  const hasDocker = checkCommand('docker', 'Docker');

  if (!hasNode) {
    logError('Node.js 18+ is required. Please install it first.');
    process.exit(1);
  }

  if (!hasPnpm) {
    log('\nInstalling pnpm globally...');
    if (!exec('npm install -g pnpm')) {
      logError('Failed to install pnpm');
      process.exit(1);
    }
  }

  if (!hasDocker) {
    logWarning('Docker is not installed. You\'ll need to setup PostgreSQL and Redis manually.');
  }

  // Step 2: Install dependencies
  logStep(2, 'Installing Dependencies');
  
  log('\nInstalling root dependencies...');
  if (!exec('pnpm install')) {
    logError('Failed to install root dependencies');
    process.exit(1);
  }

  log('\nInstalling backend dependencies...');
  if (!exec('cd backend && pnpm install')) {
    logError('Failed to install backend dependencies');
    process.exit(1);
  }

  log('\nInstalling frontend dependencies...');
  if (!exec('cd frontend/extension && pnpm install')) {
    logError('Failed to install frontend dependencies');
    process.exit(1);
  }

  // Step 3: Setup environment files
  logStep(3, 'Setting up Environment Files');
  
  copyEnvExample('backend', 'backend');
  copyEnvExample('frontend/extension', 'frontend/extension');

  // Step 4: Setup database (if Docker is available)
  if (hasDocker) {
    logStep(4, 'Starting Database Services');
    
    log('\nStarting PostgreSQL and Redis with Docker Compose...');
    if (exec('cd backend && docker-compose up -d')) {
      logSuccess('Database services started');
      
      // Wait a bit for services to start
      log('\nWaiting for services to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      log('\nRunning database migrations...');
      if (exec('cd backend && pnpm run db:migrate')) {
        logSuccess('Database migrations completed');
      } else {
        logWarning('Failed to run migrations. You may need to run them manually.');
      }
    } else {
      logWarning('Failed to start Docker services. Setup database manually.');
    }
  } else {
    logStep(4, 'Database Setup (Manual)');
    logWarning('Docker not available. Please setup PostgreSQL and Redis manually.');
    log('\nRequired services:');
    log('  - PostgreSQL 15+');
    log('  - Redis 7+');
    log('\nThen run: pnpm run db:migrate');
  }

  // Step 5: Success message
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('✅ Setup Complete!', colors.green + colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  log('Next steps:');
  log('  1. Edit backend/.env with your configuration');
  log('  2. Edit frontend/extension/.env with your configuration');
  log('  3. Start development:');
  log('     - Backend:  pnpm run dev:backend');
  log('     - Frontend: pnpm run dev:frontend');
  log('\nFor more information, see README.md\n');
}

main().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
});

