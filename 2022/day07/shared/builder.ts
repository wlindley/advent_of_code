import { DirectoryNode, FileEntry, FilesystemTree } from './model';
import { parseTerminalLog, type TerminalLine } from './parser';

interface MutableDir {
  readonly name: string;
  readonly path: string;
  readonly depth: number;
  readonly files: Map<string, number>;
  readonly subdirs: Map<string, MutableDir>;
}

interface BuilderState {
  readonly root: MutableDir;
  readonly stack: MutableDir[];
  inListing: boolean;
}

function createMutableDir(name: string, path: string, depth: number): MutableDir {
  return { name, path, depth, files: new Map(), subdirs: new Map() };
}

function childPath(parentPath: string, name: string): string {
  return parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
}

function ensureChildDir(parent: MutableDir, name: string): MutableDir {
  if (parent.files.has(name)) {
    throw new Error(`Name collision in "${parent.path}": "${name}" is already a file`);
  }
  const existing = parent.subdirs.get(name);
  if (existing) return existing;
  const child = createMutableDir(name, childPath(parent.path, name), parent.depth + 1);
  parent.subdirs.set(name, child);
  return child;
}

function recordFile(parent: MutableDir, name: string, size: number): void {
  if (parent.subdirs.has(name)) {
    throw new Error(`Name collision in "${parent.path}": "${name}" is already a directory`);
  }
  const existingSize = parent.files.get(name);
  if (existingSize !== undefined) {
    if (existingSize !== size) {
      throw new Error(
        `Conflicting size for "${childPath(parent.path, name)}": ${existingSize} vs ${size}`,
      );
    }
    return;
  }
  parent.files.set(name, size);
}

function applyLine(state: BuilderState, line: TerminalLine): void {
  const cwd = state.stack[state.stack.length - 1]!;
  switch (line.kind) {
    case 'cd-root':
      state.stack.length = 1;
      state.inListing = false;
      return;
    case 'cd-up':
      if (state.stack.length <= 1) {
        throw new Error('Cannot navigate above root directory "/"');
      }
      state.stack.pop();
      state.inListing = false;
      return;
    case 'cd-child':
      state.stack.push(ensureChildDir(cwd, line.name));
      state.inListing = false;
      return;
    case 'ls':
      state.inListing = true;
      return;
    case 'dir-entry':
      if (!state.inListing) {
        throw new Error(`Directory entry "${line.name}" appeared outside "$ ls" output`);
      }
      ensureChildDir(cwd, line.name);
      return;
    case 'file-entry':
      if (!state.inListing) {
        throw new Error(`File entry "${line.name}" appeared outside "$ ls" output`);
      }
      recordFile(cwd, line.name, line.size);
      return;
  }
}

function freezeDir(dir: MutableDir): DirectoryNode {
  const files: FileEntry[] = [];
  for (const [name, size] of dir.files) {
    files.push(new FileEntry(name, size));
  }
  const subdirs: DirectoryNode[] = [];
  for (const sub of dir.subdirs.values()) {
    subdirs.push(freezeDir(sub));
  }
  return new DirectoryNode(dir.name, dir.path, dir.depth, files, subdirs);
}

/** Builds an immutable `FilesystemTree` from parsed terminal commands and listings. */
export function buildFilesystem(lines: readonly TerminalLine[]): FilesystemTree {
  if (lines.length === 0) {
    throw new Error('Cannot build filesystem from empty terminal line sequence');
  }
  const root = createMutableDir('/', '/', 0);
  const state: BuilderState = { root, stack: [root], inListing: false };
  for (const line of lines) {
    applyLine(state, line);
  }
  return new FilesystemTree(freezeDir(root));
}

/** Parses raw terminal session text and constructs an immutable `FilesystemTree`. */
export function parseFilesystem(raw: string): FilesystemTree {
  return buildFilesystem(parseTerminalLog(raw));
}
