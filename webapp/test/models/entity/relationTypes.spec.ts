import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const entityDirectory = join(import.meta.dirname, '../../../src/models/entity');
const singleRelationDecorators = new Set(['ManyToOne', 'OneToOne']);

function hasSingleRelationDecorator(property: ts.PropertyDeclaration): boolean {
  return (ts.getDecorators(property) ?? []).some((decorator) => {
    const expression = decorator.expression;
    return (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      singleRelationDecorators.has(expression.expression.text)
    );
  });
}

// `Relation<T>` and `Relation<T> | null` are allowed. A bare class name is not.
function isWrappedInRelation(typeNode: ts.TypeNode | undefined): boolean {
  if (!typeNode) return false;
  const members = ts.isUnionTypeNode(typeNode) ? typeNode.types : [typeNode];
  return members
    .filter(
      (member) =>
        !(
          ts.isLiteralTypeNode(member) &&
          member.literal.kind === ts.SyntaxKind.NullKeyword
        ),
    )
    .every(
      (member) =>
        ts.isTypeReferenceNode(member) &&
        ts.isIdentifier(member.typeName) &&
        member.typeName.text === 'Relation',
    );
}

function findUnwrappedRelations(fileName: string): string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    readFileSync(join(entityDirectory, fileName), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const problems: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyDeclaration(node) &&
      hasSingleRelationDecorator(node) &&
      !isWrappedInRelation(node.type)
    ) {
      problems.push(
        `${fileName}: property "${node.name.getText(sourceFile)}" must be typed Relation<...>, found "${node.type?.getText(sourceFile) ?? 'no type'}"`,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return problems;
}

// With ESM and emitDecoratorMetadata, a bare class type on a ManyToOne/OneToOne
// property fails at startup with "Cannot access '<Entity>' before initialization".
describe('entity relation property types', () => {
  const entityFiles = readdirSync(entityDirectory).filter((name) =>
    name.endsWith('.entity.ts'),
  );

  it.each(entityFiles)(
    '%s types every single relation as Relation<...>',
    (fileName) => {
      expect(findUnwrappedRelations(fileName)).toEqual([]);
    },
  );
});
