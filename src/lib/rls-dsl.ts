type Operation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
type JoinType = 'inner' | 'left' | 'right' | 'full';

interface Condition {
  toSQL(): string;
}

class ColumnCondition implements Condition {
  constructor(
    private columnName: string,
    private operator?: string,
    private value?: unknown,
    private chainOp?: 'AND' | 'OR',
    private nextCondition?: Condition,
    private subquery?: SubQuery
  ) {}

  eq(value: unknown): ColumnCondition {
    return new ColumnCondition(this.columnName, '=', value);
  }

  gt(value: unknown): ColumnCondition {
    return new ColumnCondition(this.columnName, '>', value);
  }

  gte(value: unknown): ColumnCondition {
    return new ColumnCondition(this.columnName, '>=', value);
  }

  lt(value: unknown): ColumnCondition {
    return new ColumnCondition(this.columnName, '<', value);
  }

  lte(value: unknown): ColumnCondition {
    return new ColumnCondition(this.columnName, '<=', value);
  }

  like(pattern: string): ColumnCondition {
    return new ColumnCondition(this.columnName, 'LIKE', pattern);
  }

  ilike(pattern: string): ColumnCondition {
    return new ColumnCondition(this.columnName, 'ILIKE', pattern);
  }

  in(values: unknown[] | SubQuery): ColumnCondition {
    if (Array.isArray(values)) {
      return new ColumnCondition(this.columnName, 'IN', values);
    }
    return new ColumnCondition(this.columnName, 'IN', null, undefined, undefined, values);
  }

  contains(values: unknown[]): ColumnCondition {
    return new ColumnCondition(this.columnName, '@>', values);
  }

  isNull(): ColumnCondition {
    return new ColumnCondition(this.columnName, 'IS NULL');
  }

  isNotNull(): ColumnCondition {
    return new ColumnCondition(this.columnName, 'IS NOT NULL');
  }

  isOwner(): ColumnCondition {
    return this.eq(auth.uid());
  }

  isPublic(): ColumnCondition {
    return this.eq(true);
  }

  and(condition: Condition): ColumnCondition {
    return new ColumnCondition(
      this.columnName,
      this.operator,
      this.value,
      'AND',
      condition,
      this.subquery
    );
  }

  or(condition: Condition): ColumnCondition {
    return new ColumnCondition(
      this.columnName,
      this.operator,
      this.value,
      'OR',
      condition,
      this.subquery
    );
  }

  toSQL(): string {
    let sql = '';

    if (this.operator === 'IS NULL' || this.operator === 'IS NOT NULL') {
      sql = `${this.columnName} ${this.operator}`;
    } else if (this.operator === 'IN' && this.subquery) {
      sql = `${this.columnName} IN (${this.subquery.toSQL()})`;
    } else if (this.operator === 'IN' && Array.isArray(this.value)) {
      const values = this.value.map((v) => formatValue(v)).join(', ');
      sql = `${this.columnName} IN (${values})`;
    } else if (this.operator === '@>') {
      const values = Array.isArray(this.value) ? this.value : [];
      sql = `${this.columnName} @> ARRAY[${values.map((v) => formatValue(v)).join(', ')}]`;
    } else {
      sql = `${this.columnName} ${this.operator} ${formatValue(this.value)}`;
    }

    if (this.nextCondition && this.chainOp) {
      sql = `(${sql} ${this.chainOp} ${this.nextCondition.toSQL()})`;
    }

    return sql;
  }
}

class SubQuery {
  private selectColumns: string[] = [];
  private whereCondition?: Condition;
  private joins: Array<{
    table: string;
    condition: Condition;
    type: JoinType;
    alias?: string;
  }> = [];

  constructor(private tableName: string, private alias?: string) {}

  select(...columns: string[]): SubQuery {
    this.selectColumns = columns;
    return this;
  }

  where(condition: Condition): SubQuery {
    this.whereCondition = condition;
    return this;
  }

  join(table: string, condition: Condition, type: JoinType = 'inner', alias?: string): SubQuery {
    this.joins.push({ table, condition, type, alias });
    return this;
  }

  toSQL(): string {
    const cols = this.selectColumns.length > 0 ? this.selectColumns.join(', ') : '*';
    const tableRef = this.alias ? `${this.tableName} ${this.alias}` : this.tableName;

    let sql = `SELECT ${cols} FROM ${tableRef}`;

    for (const join of this.joins) {
      const joinTable = join.alias ? `${join.table} ${join.alias}` : join.table;
      sql += ` ${join.type.toUpperCase()} JOIN ${joinTable} ON ${join.condition.toSQL()}`;
    }

    if (this.whereCondition) {
      sql += ` WHERE ${this.whereCondition.toSQL()}`;
    }

    return sql;
  }
}

class AuthFunction {
  uid(): string {
    return 'auth.uid()';
  }
}

class SessionFunction {
  get(key: string, _type: string): string {
    return `current_setting('${key}', true)::${_type}`;
  }
}

function formatValue(value: unknown): string {
  if (typeof value === 'string' && value.includes('()')) {
    return value;
  }
  if (typeof value === 'string' && value.startsWith('current_setting')) {
    return value;
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return String(value);
}

export const auth = new AuthFunction();
export const session = new SessionFunction();

export function column(name: string): ColumnCondition {
  return new ColumnCondition(name);
}

export function from(tableName: string, alias?: string): SubQuery {
  return new SubQuery(tableName, alias);
}

export function currentUser(): string {
  return 'current_user';
}

interface PolicyOptions {
  includeIndexes?: boolean;
}

export class Policy {
  private tableName?: string;
  private operation?: Operation;
  private role?: string;
  private usingCondition?: Condition;
  private withCheckCondition?: Condition;
  private isRestrictive = false;
  private desc?: string;

  constructor(private policyName: string) {}

  on(table: string): Policy {
    this.tableName = table;
    return this;
  }

  for(operation: Operation): Policy {
    this.operation = operation;
    return this;
  }

  to(role: string): Policy {
    this.role = role;
    return this;
  }

  when(condition: Condition): Policy {
    this.usingCondition = condition;
    return this;
  }

  allow(condition: Condition): Policy {
    this.usingCondition = condition;
    return this;
  }

  withCheck(condition: Condition): Policy {
    this.withCheckCondition = condition;
    return this;
  }

  restrictive(): Policy {
    this.isRestrictive = true;
    return this;
  }

  description(text: string): Policy {
    this.desc = text;
    return this;
  }

  toSQL(options?: PolicyOptions): string {
    if (!this.tableName || !this.operation) {
      throw new Error('Table and operation are required');
    }

    let sql = '';

    if (this.desc) {
      sql += `-- ${this.desc}\n`;
    }

    sql += `CREATE POLICY "${this.policyName}"\n`;
    sql += `  ON ${this.tableName}\n`;
    sql += `  AS ${this.isRestrictive ? 'RESTRICTIVE' : 'PERMISSIVE'}\n`;
    sql += `  FOR ${this.operation}\n`;

    if (this.role) {
      sql += `  TO ${this.role}\n`;
    }

    if (this.usingCondition) {
      sql += `  USING (${this.usingCondition.toSQL()})`;
    }

    if (this.withCheckCondition) {
      sql += `\n  WITH CHECK (${this.withCheckCondition.toSQL()})`;
    }

    sql += ';';

    if (options?.includeIndexes) {
      const indexes = this.generateIndexes();
      if (indexes.length > 0) {
        sql += '\n\n' + indexes.join('\n');
      }
    }

    return sql;
  }

  private generateIndexes(): string[] {
    const indexes: string[] = [];
    const indexedColumns = new Set<string>();

    const extractColumns = (condition?: Condition): void => {
      if (!condition) return;
      const condSql = condition.toSQL();
      const columnMatches = condSql.match(/(\w+)\s*(?:=|>|<|>=|<=|IN)/g);
      if (columnMatches) {
        columnMatches.forEach((match) => {
          const col = match.split(/\s*(?:=|>|<|>=|<=|IN)/)[0].trim();
          if (col && !indexedColumns.has(col)) {
            indexedColumns.add(col);
            indexes.push(
              `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_${col} ON ${this.tableName} (${col});`
            );
          }
        });
      }
    };

    extractColumns(this.usingCondition);
    extractColumns(this.withCheckCondition);

    return indexes;
  }
}

export function createPolicy(name: string): Policy {
  return new Policy(name);
}

export const policies = {
  userOwned(table: string, operations: Operation = 'SELECT'): Policy[] {
    return [
      createPolicy(`${table}_user_owned`)
        .on(table)
        .for(operations)
        .when(column('user_id').eq(auth.uid())),
    ];
  },

  tenantIsolation(
    table: string,
    tenantColumn = 'tenant_id',
    sessionKey = 'app.current_tenant_id'
  ): Policy {
    return createPolicy(`${table}_tenant_isolation`)
      .on(table)
      .for('ALL')
      .restrictive()
      .when(column(tenantColumn).eq(session.get(sessionKey, 'integer')));
  },

  publicAccess(table: string, visibilityColumn = 'is_public'): Policy {
    return createPolicy(`${table}_public_access`)
      .on(table)
      .for('SELECT')
      .when(column(visibilityColumn).eq(true));
  },

  roleAccess(table: string, role: string, operations: Operation = 'SELECT'): Policy {
    return createPolicy(`${table}_${role}_access`)
      .on(table)
      .for(operations)
      .to(role);
  },
};
