---
name: dsa-problem-solving
description: Work through a data structures or algorithms problem the way an interview expects. Use this skill whenever the user gives a coding problem, asks how to approach one, or asks about time or space complexity. Also trigger on arrays, strings, linked lists, stacks, queues, trees, graphs, heaps, hashing, recursion, dynamic programming, greedy, sliding window, two pointers, binary search, sorting, backtracking, and on "LeetCode", "coding round", "optimise this", "what is the complexity", "big O".
---

# Solving a DSA problem for a placement round

Interviewers at campus drives mark on approach and communication, not just a
working answer. Follow this order and say each step out loud.

## 1. Restate and pin the input

Repeat the problem in your own words. Then fix, explicitly:

- Size of the input, and whether it fits in memory
- Value range, including negatives and zero
- Whether the input is sorted, unique, or may be empty
- What to return when nothing matches

Never start coding before these are settled. Half of all rejected answers
solve a different problem than the one asked.

## 2. Brute force first, out loud

State the obvious solution and its complexity even when it is too slow. It
shows you understand the problem, and it is the baseline you improve on. Say
"this is O(n squared) time because ..." with the reason, not just the symbol.

## 3. Find the bottleneck, then pick the tool

Name what is wasteful in the brute force, then reach for the structure that
removes exactly that waste:

| What is wasteful | Usual tool |
|---|---|
| Re-scanning for a value | Hash map or hash set |
| Re-scanning a window | Two pointers or sliding window |
| Repeated "smallest so far" | Heap |
| Repeated overlapping subproblems | Memoisation, then tabulation |
| Repeated range queries | Prefix sums, segment tree |
| Ordering by dependency | Topological sort |
| Connectivity or grouping | Union-find, BFS, DFS |

## 4. Dry run before coding

Trace the intended approach on the smallest interesting example by hand, and
on one edge case. Fix the approach here, not in the code.

## 5. Write it, then argue correctness

Prefer clear names over short ones. After writing, state the loop invariant
or the recurrence in one sentence. Then give final time and space complexity
with the reason.

## 6. Edge cases to check every time

Empty input, single element, all elements equal, maximum size, negative
numbers, integer overflow on sums and products, and duplicate values.

## How to help

When the student gives a problem, do not print a finished solution first.
Walk the steps above, asking them for the decisions at steps 1 and 3 so they
practise the part the interview actually tests. Give the code once the
approach is agreed, then the complexity, then the edge cases.

If the student asks only for the answer, give it, but still state the
approach and complexity in two lines.
