import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

async function readJson(relativePath) {
  const content = await readFile(path.join(root, relativePath), 'utf8')
  return JSON.parse(content)
}

async function listFiles(dir, options = {}) {
  const { extensions = [], prefix = '' } = options
  const entries = await readdir(path.join(root, dir), { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const relativePath = path.posix.join(dir.replace(/\\/g, '/'), entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(relativePath, options)))
      continue
    }

    if (extensions.length && !extensions.some((ext) => entry.name.endsWith(ext))) {
      continue
    }

    files.push(prefix + relativePath)
  }

  return files.sort()
}

async function getProjectStats() {
  const srcStats = await stat(path.join(root, 'src'))
  return {
    generatedAt: new Date().toISOString(),
    srcModifiedAt: srcStats.mtime.toISOString(),
  }
}

function formatDependencies(packageJson) {
  const sections = ['dependencies', 'devDependencies']
  return sections
    .flatMap((section) =>
      Object.entries(packageJson[section] ?? {}).map(
        ([name, version]) => `- **${name}**: ${version}`,
      ),
    )
    .join('\n')
}

function formatScripts(packageJson) {
  return Object.entries(packageJson.scripts ?? {})
    .map(([name, command]) => `- \`${name}\`: \`${command}\``)
    .join('\n')
}

function formatAliases(componentsJson) {
  return Object.entries(componentsJson.aliases ?? {})
    .map(([key, value]) => `- \`${key}\`: \`${value}\``)
    .join('\n')
}

function replaceSection(content, name, nextSection) {
  const start = `<!-- AUTO:${name}:START -->`
  const end = `<!-- AUTO:${name}:END -->`
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  const replacement = `${start}\n${nextSection.trim()}\n${end}`

  if (!pattern.test(content)) {
    throw new Error(`Missing SCD auto section: ${name}`)
  }

  return content.replace(pattern, replacement)
}

async function buildAutoSections() {
  const [packageJson, componentsJson, stats] = await Promise.all([
    readJson('package.json'),
    readJson('components.json'),
    getProjectStats(),
  ])

  const uiComponents = await listFiles('src/components/ui', {
    extensions: ['.tsx'],
    prefix: '- `',
  })
  const appComponents = await listFiles('src/components', {
    extensions: ['.tsx'],
  }).then((files) =>
    files
      .filter((file) => !file.includes('/ui/'))
      .map((file) => `- \`${file}\``),
  )
  const hooks = await listFiles('src/hooks', { extensions: ['.ts', '.tsx'] }).then(
    (files) => files.map((file) => `- \`${file}\``),
  )
  const routes = await listFiles('src/routes', { extensions: ['.ts', '.tsx'] }).then(
    (files) => files.map((file) => `- \`${file}\``),
  )
  const libFiles = await listFiles('src/lib', { extensions: ['.ts', '.tsx'] }).then(
    (files) => files.map((file) => `- \`${file}\``),
  )

  return {
    metadata: [
      `- **Proyecto**: ${packageJson.name}`,
      `- **Versión**: ${packageJson.version}`,
      `- **Última actualización automática**: ${stats.generatedAt}`,
      `- **Última modificación en \`src/\`**: ${stats.srcModifiedAt}`,
    ].join('\n'),
    stack: [
      '### Dependencias',
      formatDependencies(packageJson),
      '',
      '### Scripts',
      formatScripts(packageJson),
    ].join('\n'),
    shadcn: [
      `- **Estilo**: ${componentsJson.style}`,
      `- **Iconos**: ${componentsJson.iconLibrary}`,
      `- **CSS**: \`${componentsJson.tailwind.css}\``,
      `- **Variables CSS**: ${componentsJson.tailwind.cssVariables ? 'sí' : 'no'}`,
      '',
      '### Aliases',
      formatAliases(componentsJson),
      '',
      '### Componentes UI instalados',
      uiComponents.length
        ? uiComponents.map((file) => `${file}\``).join('\n')
        : '- _(ninguno)_',
    ].join('\n'),
    structure: [
      '### Componentes de aplicación',
      appComponents.length ? appComponents.join('\n') : '- _(ninguno)_',
      '',
      '### Hooks',
      hooks.length ? hooks.join('\n') : '- _(ninguno)_',
      '',
      '### Rutas',
      routes.length ? routes.join('\n') : '- _(ninguno)_',
      '',
      '### Utilidades',
      libFiles.length ? libFiles.join('\n') : '- _(ninguno)_',
    ].join('\n'),
    mcp: [
      'Servidor MCP configurado en `.cursor/mcp.json`:',
      '',
      '```json',
      JSON.stringify({ mcpServers: { shadcn: { command: 'npx', args: ['shadcn@latest', 'mcp'] } } }, null, 2),
      '```',
    ].join('\n'),
  }
}

async function main() {
  const scdPath = path.join(root, 'SCD.md')
  let content = await readFile(scdPath, 'utf8')
  const sections = await buildAutoSections()

  for (const [name, value] of Object.entries(sections)) {
    content = replaceSection(content, name, value)
  }

  await writeFile(scdPath, content, 'utf8')
  console.log('SCD.md actualizado correctamente.')
}

main().catch((error) => {
  console.error('Error actualizando SCD.md:', error.message)
  process.exit(1)
})
