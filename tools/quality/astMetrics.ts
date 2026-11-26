import ts from 'typescript';
import type { CodeHotspot } from '../../site/data/quality';

export interface FileAstMetrics {
  readonly filePath: string;
  readonly sloc: number;
  readonly functionCount: number;
  readonly totalCyclomatic: number;
  readonly maxCyclomatic: number;
  readonly maxNestingDepth: number;
  readonly maxFunctionSloc: number;
  readonly nestedFunctionCount: number;
  readonly halsteadVolume: number;
  readonly maintainabilityIndex: number;
  readonly maxCyclomaticHotspot: CodeHotspot | null;
  readonly maxNestingHotspot: CodeHotspot | null;
  readonly longestFunctionHotspot: CodeHotspot | null;
}

const BRANCH_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.ConditionalExpression,
]);

const NESTING_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.SwitchStatement,
  ts.SyntaxKind.TryStatement,
]);

const LOGICAL_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

const OPERAND_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.Identifier,
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.BigIntLiteral,
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.RegularExpressionLiteral,
]);

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)
  );
}

function isElseIf(node: ts.Node): boolean {
  return ts.isIfStatement(node) && ts.isIfStatement(node.parent) && node.parent.elseStatement === node;
}

function functionDisplayName(node: ts.Node): string {
  if (ts.isConstructorDeclaration(node)) return 'constructor';
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) && node.name) {
    return node.name.getText();
  }
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
    return node.parent.name.text;
  }
  return '<anonymous>';
}

function scanTokens(
  sourceFile: ts.SourceFile,
  sourceText: string,
  variant: ts.LanguageVariant,
): { sloc: number; halsteadVolume: number } {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, variant, sourceText);
  const codeLines = new Set<number>();
  const operators = new Set<string>();
  const operands = new Set<string>();
  let totalOperators = 0;
  let totalOperands = 0;

  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const kind = scanner.getToken();
    codeLines.add(sourceFile.getLineAndCharacterOfPosition(scanner.getTokenPos()).line);
    const text = scanner.getTokenText();
    if (OPERAND_KINDS.has(kind)) {
      operands.add(text);
      totalOperands += 1;
    } else {
      operators.add(text);
      totalOperators += 1;
    }
  }

  const vocab = operators.size + operands.size;
  const length = totalOperators + totalOperands;
  const halsteadVolume = vocab > 0 ? Math.round(length * Math.log2(vocab) * 10) / 10 : 0;
  return { sloc: codeLines.size, halsteadVolume };
}

interface BodyAcc {
  cyclomatic: number;
  maxDepth: number;
}

function visitFunctionNode(node: ts.Node, root: ts.Node, depth: number, acc: BodyAcc): void {
  if (node !== root && isFunctionLike(node)) return;
  if (BRANCH_KINDS.has(node.kind)) {
    acc.cyclomatic += 1;
  } else if (ts.isBinaryExpression(node) && LOGICAL_OPERATORS.has(node.operatorToken.kind)) {
    acc.cyclomatic += 1;
  }
  const nextDepth = NESTING_KINDS.has(node.kind) && !isElseIf(node) ? depth + 1 : depth;
  if (nextDepth > acc.maxDepth) acc.maxDepth = nextDepth;
  ts.forEachChild(node, (child) => visitFunctionNode(child, root, nextDepth, acc));
}

function measureFunctionBody(root: ts.Node): BodyAcc {
  const acc: BodyAcc = { cyclomatic: 1, maxDepth: 0 };
  ts.forEachChild(root, (child) => visitFunctionNode(child, root, 0, acc));
  return acc;
}

interface FileFnAcc {
  functionCount: number;
  totalCyclomatic: number;
  maxCyclomatic: number;
  maxNestingDepth: number;
  maxFunctionSloc: number;
  nestedFunctionCount: number;
  maxCyclomaticHotspot: CodeHotspot | null;
  maxNestingHotspot: CodeHotspot | null;
  longestFunctionHotspot: CodeHotspot | null;
}

function recordFunctionMetrics(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  filePath: string,
  insideFunction: boolean,
  acc: FileFnAcc,
): void {
  acc.functionCount += 1;
  if (insideFunction && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node))) {
    acc.nestedFunctionCount += 1;
  }
  const { cyclomatic, maxDepth } = measureFunctionBody(node);
  const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  const fnSloc = endLine - startLine + 1;
  const name = functionDisplayName(node);

  acc.totalCyclomatic += cyclomatic;
  if (cyclomatic > acc.maxCyclomatic) {
    acc.maxCyclomatic = cyclomatic;
    acc.maxCyclomaticHotspot = { filePath, name, startLine, endLine, value: cyclomatic };
  }
  if (maxDepth > acc.maxNestingDepth) {
    acc.maxNestingDepth = maxDepth;
    acc.maxNestingHotspot = { filePath, name, startLine, endLine, value: maxDepth };
  }
  if (fnSloc > acc.maxFunctionSloc) {
    acc.maxFunctionSloc = fnSloc;
    acc.longestFunctionHotspot = { filePath, name, startLine, endLine, value: fnSloc };
  }
}

function collectFunctions(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  filePath: string,
  insideFunction: boolean,
  acc: FileFnAcc,
): void {
  const isFn = isFunctionLike(node);
  if (isFn) recordFunctionMetrics(node, sourceFile, filePath, insideFunction, acc);
  const nextInside = insideFunction || isFn;
  ts.forEachChild(node, (child) => collectFunctions(child, sourceFile, filePath, nextInside, acc));
}

function computeMaintainabilityIndex(sloc: number, halsteadVolume: number, totalCc: number, fnCount: number): number {
  if (sloc === 0) return 100;
  const denom = Math.max(1, fnCount);
  const meanSloc = sloc / denom;
  const meanVolume = halsteadVolume / denom;
  const meanCc = Math.max(1, totalCc) / denom;
  const rawMi = 171 - 5.2 * Math.log(Math.max(1, meanVolume)) - 0.23 * meanCc - 16.2 * Math.log(Math.max(1, meanSloc));
  return Math.round(Math.max(0, Math.min(100, rawMi)) * 10) / 10;
}

export function analyzeSourceFile(filePath: string, sourceText: string): FileAstMetrics {
  const isTsx = filePath.endsWith('.tsx');
  const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const variant = isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const { sloc, halsteadVolume } = scanTokens(sourceFile, sourceText, variant);
  const fns: FileFnAcc = {
    functionCount: 0,
    totalCyclomatic: 0,
    maxCyclomatic: 0,
    maxNestingDepth: 0,
    maxFunctionSloc: 0,
    nestedFunctionCount: 0,
    maxCyclomaticHotspot: null,
    maxNestingHotspot: null,
    longestFunctionHotspot: null,
  };
  collectFunctions(sourceFile, sourceFile, filePath, false, fns);

  return {
    filePath,
    sloc,
    ...fns,
    halsteadVolume,
    maintainabilityIndex: computeMaintainabilityIndex(sloc, halsteadVolume, fns.totalCyclomatic, fns.functionCount),
  };
}
