import { isValidEntryName } from './parser';

function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function assertDirectoryName(name: string): void {
  if (name !== '/' && !isValidEntryName(name)) {
    throw new Error(`Invalid directory name: "${name}"`);
  }
}

function assertRootedPath(path: string): void {
  if (!path.startsWith('/')) {
    throw new Error(`Directory path must start with '/': "${path}"`);
  }
}

/** Immutable file entry belonging to a single directory. */
export class FileEntry {
  readonly name: string;
  readonly size: number;

  constructor(name: string, size: number) {
    if (!isValidEntryName(name)) {
      throw new Error(`Invalid file name: "${name}"`);
    }
    assertNonNegativeInt(size, 'file size');
    this.name = name;
    this.size = size;
    Object.freeze(this);
  }
}

/** Immutable directory tree node; recursive sizes are computed dynamically. */
export class DirectoryNode {
  readonly name: string;
  readonly path: string;
  readonly depth: number;
  readonly files: readonly FileEntry[];
  readonly subdirectories: readonly DirectoryNode[];

  constructor(
    name: string,
    path: string,
    depth: number,
    files: readonly FileEntry[],
    subdirectories: readonly DirectoryNode[],
  ) {
    assertDirectoryName(name);
    assertRootedPath(path);
    assertNonNegativeInt(depth, 'directory depth');
    this.name = name;
    this.path = path;
    this.depth = depth;
    this.files = Object.freeze([...files]);
    this.subdirectories = Object.freeze([...subdirectories]);
    Object.freeze(this);
  }

  get directFileSize(): number {
    let sum = 0;
    for (const file of this.files) sum += file.size;
    return sum;
  }

  get totalSize(): number {
    let sum = this.directFileSize;
    for (const sub of this.subdirectories) sum += sub.totalSize;
    return sum;
  }

  get isEmpty(): boolean {
    return this.files.length === 0 && this.subdirectories.length === 0;
  }
}

/** Post-order summary metrics for one directory; `totalSize` is derived dynamically. */
export class DirectoryMetrics {
  readonly path: string;
  readonly name: string;
  readonly depth: number;
  readonly directFileSize: number;
  readonly childDirSize: number;
  readonly fileCount: number;
  readonly childDirCount: number;

  constructor(
    path: string,
    name: string,
    depth: number,
    directFileSize: number,
    childDirSize: number,
    fileCount: number,
    childDirCount: number,
  ) {
    assertRootedPath(path);
    assertDirectoryName(name);
    assertNonNegativeInt(depth, 'depth');
    assertNonNegativeInt(directFileSize, 'directFileSize');
    assertNonNegativeInt(childDirSize, 'childDirSize');
    assertNonNegativeInt(fileCount, 'fileCount');
    assertNonNegativeInt(childDirCount, 'childDirCount');
    this.path = path;
    this.name = name;
    this.depth = depth;
    this.directFileSize = directFileSize;
    this.childDirSize = childDirSize;
    this.fileCount = fileCount;
    this.childDirCount = childDirCount;
    Object.freeze(this);
  }

  get totalSize(): number {
    return this.directFileSize + this.childDirSize;
  }
}

function visitPostOrder(dir: DirectoryNode, out: DirectoryMetrics[]): number {
  let childDirSize = 0;
  for (const sub of dir.subdirectories) {
    childDirSize += visitPostOrder(sub, out);
  }
  const metrics = new DirectoryMetrics(
    dir.path,
    dir.name,
    dir.depth,
    dir.directFileSize,
    childDirSize,
    dir.files.length,
    dir.subdirectories.length,
  );
  out.push(metrics);
  return metrics.totalSize;
}

/** Rooted immutable filesystem tree supporting single-pass post-order directory metrics. */
export class FilesystemTree {
  readonly root: DirectoryNode;

  constructor(root: DirectoryNode) {
    if (root.path !== '/' || root.depth !== 0) {
      throw new Error('FilesystemTree root must have path "/" and depth 0');
    }
    this.root = root;
    Object.freeze(this);
  }

  get totalSize(): number {
    return this.root.totalSize;
  }

  collectDirectoryMetrics(): readonly DirectoryMetrics[] {
    const out: DirectoryMetrics[] = [];
    visitPostOrder(this.root, out);
    return Object.freeze(out);
  }
}
