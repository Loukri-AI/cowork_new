---
name: sql-and-databases
description: Write and explain SQL queries, normalise a schema, or work through DBMS topics such as keys, joins, indexing, transactions and ACID. Use for database coursework, lab exercises, or query debugging.
---

# SQL and database coursework

## Writing a query

Build it in the order the database evaluates it, not the order it is written:

1. `FROM` and `JOIN`: which tables, and how they relate
2. `WHERE`: filter individual rows
3. `GROUP BY`: form the groups
4. `HAVING`: filter the groups
5. `SELECT`: choose the columns
6. `ORDER BY`, then `LIMIT`

Two rules that fix most student mistakes: a condition on an individual row
belongs in `WHERE`, a condition on an aggregate belongs in `HAVING`; and
every non-aggregated column in `SELECT` must appear in `GROUP BY`.

## Joins

- `INNER JOIN` keeps rows matching on both sides
- `LEFT JOIN` keeps every row from the left, filling nulls on the right
- A `WHERE` condition on the right table of a `LEFT JOIN` silently turns it
  into an inner join. Put that condition in the `ON` clause instead.
- A join with no condition produces a cross product. If a count is far
  larger than expected, look here first.

## Normalisation

State the functional dependencies first, then apply the forms in order.

| Form | Requirement |
|---|---|
| 1NF | Every value atomic; no repeating groups |
| 2NF | 1NF, and no partial dependency on part of a composite key |
| 3NF | 2NF, and no transitive dependency on a non-key attribute |
| BCNF | Every determinant is a candidate key |

Find candidate keys by computing attribute closures. Show the closure
working, because that is what exam papers award marks for.

## Transactions

ACID means atomicity, consistency, isolation and durability. Be able to name
the anomaly each isolation level permits: dirty read, non-repeatable read,
phantom read. Know that serialisable forbids all three and costs the most
concurrency.

## Indexing

An index speeds lookups and slows writes. A B-tree index helps equality and
range queries and `ORDER BY` on the same column order. It does not help when
the column is wrapped in a function in the `WHERE` clause.

## How to help

Give the query, then explain what each clause does in the student's own
schema terms. For schema questions, show the dependencies and the decomposed
tables, not just the final answer. For lab exercises, include the `CREATE
TABLE` statements so the student can run it.
