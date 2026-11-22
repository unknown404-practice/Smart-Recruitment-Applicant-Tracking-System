import fs from 'fs';
import path from 'path';

/**
 * Smart ATS - Automated CI Secret & Credential Scanner
 * Scans repository files to ensure zero committed credentials, tokens, or private keys.
 */

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Private Key (PEM)', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Access Key Pattern', regex: /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/i },
  { name: 'Slack Webhook', regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8}\/B[0-9A-Z]{8}\/[0-9A-Za-z]{24}/ },
  { name: 'Generic Hardcoded JWT', regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Production Database Password in URL', regex: /postgres:\/\/[^:]+:[^@]+@(?:production|aws|supabase|neon)/i },
];

const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.gemini',
];

const IGNORE_FILES = [
  'package-lock.json',
  'scan-secrets.ts',
];

function scanDirectory(dir: string, foundSecrets: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath, foundSecrets);
      }
    } else if (entry.isFile()) {
      if (IGNORE_FILES.includes(entry.name)) continue;

      // Only scan code, config, markdown, and env files
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.sql', '.md', '.env', '.example'].includes(ext)) {
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(content)) {
            // Check if it is a test mock or documentation example
            const isMockOrTest = fullPath.includes('test') || fullPath.includes('mock');
            if (pattern.name === 'Generic Hardcoded JWT' && isMockOrTest) {
              continue; // Allow synthetic mock tokens in tests
            }
            foundSecrets.push(`[${pattern.name}] found in ${fullPath}`);
          }
        }
      } catch (err: any) {
        console.warn(`Could not read ${fullPath}: ${err.message}`);
      }
    }
  }
}

async function runSecretScan() {
  console.log('============================================================');
  console.log('Smart ATS - Automated Secret & Credentials Scanner (Floor 23)');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '..');
  const foundSecrets: string[] = [];

  // 1. Verify .gitignore protects .env files
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      foundSecrets.push('[Configuration Risk] .gitignore does not explicitly ignore .env files!');
    }
  }

  // 2. Scan repository
  scanDirectory(rootDir, foundSecrets);

  if (foundSecrets.length > 0) {
    console.error(`\n❌ Secret scan failed! Found ${foundSecrets.length} potential security exposure(s):`);
    foundSecrets.forEach((s) => console.error(`  -> ${s}`));
    process.exit(1);
  } else {
    console.log('\n✅ Secret scan passed cleanly. Zero unencrypted secrets detected across repository.');
  }
}

if (require.main === module) {
  runSecretScan();
}
