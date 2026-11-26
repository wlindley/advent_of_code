import ts from 'typescript';

export interface FileAstMetrics {
  readonly filePath: string;
  readonly sloc: number;
  readonly functionCount: number;
  readonly totalCyclomatic: number;
  readonly maxCyclomatic: number;
  readonly maxNestingDepth: number;
  readonly halsteadVolume: number;
  readonly maintainabilityIndex: number;
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
    const pos = scanner.getTokenPos();
    codeLines.add(sourceFile.getLineAndCharacterOfPosition(pos).line);
    const text = scanner.getTokenText();
    if (
      kind === ts.SyntaxKind.Identifier ||
      kind === ts.SyntaxKind.NumericLiteral ||
      kind === ts.SyntaxKind.BigIntLiteral ||
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      kind === ts.SyntaxKind.RegularExpressionLiteral
    ) {
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

function measureFunctionBody(root: ts.Node): { cyclomatic: number; maxDepth: number } {
  let cyclomatic = 1;
  let maxDepth = 0;

  function visit(node: ts.Node, depth: number): void {
    // Nested functions are measured independently so outer complexity isn't double-counted.
    if (node !== root && isFunctionLike(node)) return;

    if (BRANCH_KINDS.has(node.kind)) {
      cyclomatic += 1;
    } else if (ts.isBinaryExpression(node) && LOGICAL_OPERATORS.has(node.operatorToken.kind)) {
      cyclomatic += 1;
    }

    const addsNesting = NESTING_KINDS.has(node.kind) && !isElseIf(node);
    const nextDepth = addsNesting ? depth + 1 : depth;
    if (nextDepth > maxDepth) maxDepth = nextDepth;
    ts.forEachChild(node, (child) => visit(child, nextDepth));
  }

  ts.forEachChild(root, (child) => visit(child, 0));
  return { cyclomatic, maxDepth };
}

export function analyzeSourceFile(filePath: string, sourceText: string): FileAstMetrics {
  const isTsx = filePath.endsWith('.tsx');
  const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const variant = isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const { sloc, halsteadVolume } = scanTokens(sourceFile, sourceText, variant);

  let functionCount = 0;
  let totalCyclomatic = 0;
  let maxCyclomatic = 0;
  let maxNestingDepth = 0;

  function collectFunctions(node: ts.Node): void {
    if (isFunctionLike(node)) {
      functionCount += 1;
      const { cyclomatic, maxDepth } = measureFunctionBody(node);
      totalCyclomatic += cyclomatic;
      if (cyclomatic > maxCyclomatic) maxCyclomatic = cyclomatic;
      if (maxDepth > maxNestingDepth) maxNestingDepth = maxDepth;
    }
    ts.forEachChild(node, collectFunctions);
  }

  collectFunctions(sourceFile);

  // Per-function SEI Maintainability Index (0-100): rewards small, low-CC functions without penalizing modular files.
  const denom = Math.max(1, functionCount);
  const meanSloc = sloc / denom;
  const meanVolume = halsteadVolume / denom;
  const meanCc = Math.max(1, totalCyclomatic) / denom;
  const rawMi =
    sloc === 0
      ? 100
      : 171 - 5.2 * Math.log(Math.max(1, meanVolume)) - 0.23 * meanCc - 16.2 * Math.log(Math.max(1, meanSloc));
  const maintainabilityIndex = Math.round(Math.max(0, Math.min(100, rawMi)) * 10) / 10;

  return {
    filePath,
    sloc,
    functionCount,
    totalCyclomatic,
    maxCyclomatic,
    maxNestingDepth,
    halsteadVolume,
    maintainabilityIndex,
  };
}
