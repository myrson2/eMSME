/**
 * .agents Directory Validator Script
 * Developed by AI Solutions Architect & Senior Project Manager
 * 
 * Usage:
 *   node validate-agents-dir.js [target-directory]
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

console.log(`\n======================================================`);
console.log(`  🔍 .agents Directory Health Check & Validation Tool`);
console.log(`======================================================\n`);
console.log(`Target Workspace Directory: ${targetDir}\n`);

let totalErrors = 0;
let totalWarnings = 0;
let totalPassed = 0;

function logPass(msg) {
  totalPassed++;
  console.log(`  ✅ PASS: ${msg}`);
}

function logWarning(folder, issue, whyItMatters, fix) {
  totalWarnings++;
  console.log(`\n  🟡 WARNING [${folder}]`);
  console.log(`     Issue: ${issue}`);
  console.log(`     Why it matters: ${whyItMatters}`);
  console.log(`     How to Fix: ${fix}\n`);
}

function logError(folder, issue, whyItMatters, fix) {
  totalErrors++;
  console.log(`\n  ❌ ERROR [${folder}]`);
  console.log(`     Issue: ${issue}`);
  console.log(`     Why it matters: ${whyItMatters}`);
  console.log(`     How to Fix: ${fix}\n`);
}

function findAgentsDirs(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === '.agents') {
          fileList.push(filePath);
        } else {
          findAgentsDirs(filePath, fileList);
        }
      }
    } catch (e) {
      // Ignore unreadable dirs
    }
  }
  return fileList;
}

const agentsDirs = findAgentsDirs(targetDir);

if (agentsDirs.length === 0) {
  logError('.', 'No .agents directory found in target path', 
    'AI agents rely on .agents to understand project context, specs, skills, and memory.', 
    'Create a .agents/ directory in your project root with AGENTS.md');
  process.exit(1);
}

agentsDirs.forEach((agentsDir) => {
  const relPath = path.relative(targetDir, agentsDir) || '.agents';
  console.log(`------------------------------------------------------`);
  console.log(`📂 Inspecting: ${relPath}`);
  console.log(`------------------------------------------------------`);

  // 1. Validate AGENTS.md
  const agentsMdPath = path.join(agentsDir, 'AGENTS.md');
  if (!fs.existsSync(agentsMdPath)) {
    logError(relPath, 'Missing AGENTS.md in root of .agents directory',
      'AGENTS.md is the primary entry point for AI agents to load project rules and constraints.',
      `Create ${path.join(relPath, 'AGENTS.md')} using the standard project template.`);
  } else {
    logPass(`${relPath}/AGENTS.md exists`);
    const content = fs.readFileSync(agentsMdPath, 'utf-8');
    const requiredSections = [
      'Project Context',
      'Tech Stack Constraints',
      'Where Everything Lives',
      'Required Workflow',
      'Skills',
      'MCPs',
      'Guardrails',
      'Current Priorities',
      'Session Handoff',
      'Project Structure'
    ];

    requiredSections.forEach(section => {
      if (!content.includes(section)) {
        logWarning(`${relPath}/AGENTS.md`, `Missing standard section: "${section}"`,
          'AI agents might miss critical guidelines during initialization.',
          `Add section "## ${section}" into ${relPath}/AGENTS.md`);
      }
    });
  }

  // 2. Validate specs/ folder
  const specsDir = path.join(agentsDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    logError(relPath, 'Missing "specs" directory inside .agents',
      'Spec-driven development requires a specs/ folder to store feature specifications.',
      `Create directory ${path.join(relPath, 'specs')}`);
  } else {
    logPass(`${relPath}/specs directory exists`);
    const featureFolders = fs.readdirSync(specsDir).filter(f => {
      const full = path.join(specsDir, f);
      return fs.statSync(full).isDirectory();
    });

    if (featureFolders.length === 0) {
      logWarning(`${relPath}/specs`, 'No feature subdirectories found in specs/',
        'No feature specifications exist for active development.',
        `Create a feature directory like ${relPath}/specs/my-feature/ with required spec files.`);
    }

    featureFolders.forEach(feature => {
      const featDir = path.join(specsDir, feature);
      const featRel = path.relative(targetDir, featDir);
      
      const hasSpec = fs.existsSync(path.join(featDir, 'spec.md'));
      const hasArch = fs.existsSync(path.join(featDir, 'architecture.md')) || fs.existsSync(path.join(featDir, 'arch.md'));
      const hasImpl = fs.existsSync(path.join(featDir, 'implementation.md')) || fs.existsSync(path.join(featDir, 'impl.md'));
      const hasDecisions = fs.existsSync(path.join(featDir, 'decisions.md'));

      if (hasSpec && hasArch && hasImpl && hasDecisions) {
        logPass(`${featRel} (Complete feature spec suite: spec, architecture, implementation, decisions)`);
      } else {
        if (!hasSpec) logError(featRel, 'Missing spec.md', 'Feature scope and user stories are missing.', `Add ${featRel}/spec.md based on spec template.`);
        if (!hasArch) logError(featRel, 'Missing architecture.md (or arch.md)', 'Technical design and schema definitions are missing.', `Add ${featRel}/architecture.md based on architecture template.`);
        if (!hasImpl) logError(featRel, 'Missing implementation.md (or impl.md)', 'Task breakdown and checkboxes are missing.', `Add ${featRel}/implementation.md based on implementation template.`);
        if (!hasDecisions) logWarning(featRel, 'Missing decisions.md', 'Architectural decision records are not tracked.', `Add ${featRel}/decisions.md to log key design choices.`);
      }
    });
  }

  // 3. Validate architecture/ folder
  const archDir = path.join(agentsDir, 'architecture');
  if (!fs.existsSync(archDir)) {
    logWarning(relPath, 'Missing "architecture" directory',
      'Cross-feature system design overview is not grouped cleanly.',
      `Create ${path.join(relPath, 'architecture')} directory.`);
  } else {
    logPass(`${relPath}/architecture directory exists`);
    if (!fs.existsSync(path.join(archDir, 'system-overview.md'))) {
      logWarning(`${relPath}/architecture`, 'Missing system-overview.md',
        'System architecture overview provides broad context to agents.',
        `Create ${relPath}/architecture/system-overview.md`);
    }
  }

  // 4. Validate conventions/ folder
  const convDir = path.join(agentsDir, 'conventions');
  if (!fs.existsSync(convDir)) {
    logWarning(relPath, 'Missing "conventions" directory',
      'Team coding style and git conventions should be stored here.',
      `Create ${path.join(relPath, 'conventions')} directory.`);
  } else {
    logPass(`${relPath}/conventions directory exists`);
  }

  // 5. Validate mcps/ folder
  const mcpsDir = path.join(agentsDir, 'mcps');
  if (!fs.existsSync(mcpsDir)) {
    logWarning(relPath, 'Missing "mcps" directory',
      'External MCP tools and configurations are not documented.',
      `Create ${path.join(relPath, 'mcps')} directory.`);
  } else {
    logPass(`${relPath}/mcps directory exists`);
    if (!fs.existsSync(path.join(mcpsDir, 'mcp-config.md'))) {
      logWarning(`${relPath}/mcps`, 'Missing mcp-config.md',
        'Agents cannot verify connected MCP tools.',
        `Create ${relPath}/mcps/mcp-config.md`);
    }
  }

  // 6. Validate memory/ folder
  const memoryDir = path.join(agentsDir, 'memory');
  if (!fs.existsSync(memoryDir)) {
    logError(relPath, 'Missing "memory" directory',
      'Session handoff notes will be lost across context windows.',
      `Create ${path.join(relPath, 'memory')} directory.`);
  } else {
    logPass(`${relPath}/memory directory exists`);
    if (!fs.existsSync(path.join(memoryDir, 'context.md'))) {
      logError(`${relPath}/memory`, 'Missing context.md',
        'Session handoff notes are missing. AI agents cannot track work across sessions.',
        `Create ${relPath}/memory/context.md`);
    }
  }

  // 7. Validate skills/ folder
  const skillsDir = path.join(agentsDir, 'skills');
  if (!fs.existsSync(skillsDir)) {
    logWarning(relPath, 'Missing "skills" directory',
      'Reusable agent skills cannot be discovered.',
      `Create ${path.join(relPath, 'skills')} directory.`);
  } else {
    logPass(`${relPath}/skills directory exists`);
    const skillEntries = fs.readdirSync(skillsDir);
    skillEntries.forEach(entry => {
      const fullPath = path.join(skillsDir, entry);
      const isDir = fs.statSync(fullPath).isDirectory();
      if (isDir) {
        const skillMd = path.join(fullPath, 'SKILL.md');
        if (!fs.existsSync(skillMd)) {
          logError(`${relPath}/skills/${entry}`, 'Missing SKILL.md inside skill folder',
            'Skill folder must contain SKILL.md with frontmatter and instructions.',
            `Create ${relPath}/skills/${entry}/SKILL.md`);
        } else {
          logPass(`${relPath}/skills/${entry}/SKILL.md exists`);
        }
      }
    });
  }
});

console.log(`\n======================================================`);
console.log(`  📊 Validation Summary`);
console.log(`======================================================`);
console.log(`  Passed Checks:   ${totalPassed}`);
console.log(`  Warnings:        ${totalWarnings}`);
console.log(`  Errors:          ${totalErrors}`);

if (totalErrors > 0) {
  console.log(`\n❌ Validation Failed with ${totalErrors} error(s). Please resolve the errors listed above.`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`\n🟡 Validation Passed with ${totalWarnings} warning(s). Recommended to fix warnings for optimal agent performance.`);
  process.exit(0);
} else {
  console.log(`\n✨ Perfect! All .agents directories comply with standards.`);
  process.exit(0);
}
