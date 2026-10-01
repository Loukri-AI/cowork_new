import type { SourceEntry, SourceType } from '@aaif/goose-acp-client';
import { getAcpClient } from './acpConnection';

const SKILL_SOURCE_TYPES: SourceType[] = ['skill', 'builtinSkill'];
const inFlightSkillSourceLoads = new Map<string, Promise<SourceEntry[]>>();

export async function listSkillSources(projectDir: string): Promise<SourceEntry[]> {
  const inFlightLoad = inFlightSkillSourceLoads.get(projectDir);
  if (inFlightLoad) {
    return inFlightLoad;
  }

  const load = loadSkillSources(projectDir);
  inFlightSkillSourceLoads.set(projectDir, load);

  try {
    return await load;
  } finally {
    if (inFlightSkillSourceLoads.get(projectDir) === load) {
      inFlightSkillSourceLoads.delete(projectDir);
    }
  }
}

async function loadSkillSources(projectDir: string): Promise<SourceEntry[]> {
  const client = await getAcpClient();
  const responses = await Promise.all(
    SKILL_SOURCE_TYPES.map((type) =>
      client.goose.sourcesList_unstable({
        type,
        projectDir,
      })
    )
  );

  return responses
    .flatMap((response) => response.sources)
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
        a.path.localeCompare(b.path)
    );
}

/**
 * Install a `.skill` bundle someone downloaded or was sent.
 *
 * The zip goes over JSON-RPC as base64, since the protocol carries no binary.
 * The backend validates the archive before writing anything.
 */
export async function importSkillBundle(
  bytes: Uint8Array,
  projectDir: string,
  global = true
): Promise<SourceEntry> {
  const client = await getAcpClient();
  const response = (await client.connection.agent.request('_goose/unstable/skills/bundle/import', {
    data: bytesToBase64(bytes),
    global,
    projectDir,
  })) as { source: SourceEntry };
  return response.source;
}

/** Pack an installed skill into a `.skill` bundle for sharing. */
export async function exportSkillBundle(
  path: string
): Promise<{ bytes: Uint8Array; filename: string }> {
  const client = await getAcpClient();
  const response = (await client.connection.agent.request('_goose/unstable/skills/bundle/export', {
    path,
  })) as { data: string; filename: string };
  return { bytes: base64ToBytes(response.data), filename: response.filename };
}

// btoa and atob work on binary strings, so the bytes are walked in chunks
// rather than spread into one call, which overflows the argument limit on a
// bundle of any size.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Remove an installed skill from this computer. */
export async function deleteSkillSource(path: string): Promise<void> {
  const client = await getAcpClient();
  await client.connection.agent.request('_goose/unstable/sources/delete', {
    type: 'skill',
    path,
  });
}
