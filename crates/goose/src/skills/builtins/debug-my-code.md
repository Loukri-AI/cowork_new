---
name: debug-my-code
description: Find why a program crashes, loops forever or gives wrong output. Use this skill whenever the user pastes code with an error, a stack trace, a compiler message, or says their code is not working. Also trigger on segmentation fault, NullPointerException, IndexOutOfBounds, IndentationError, undefined, infinite loop, "wrong answer", "why is this not working", "it compiles but", and on any pasted traceback in C, C++, Java or Python.
---

# Debugging a student's program

The goal is that they can fix the next one themselves, so name the cause
before giving the correction.

## Read the error properly first

A compiler or runtime message names a file, a line, and a kind of fault.
Read all three before looking at the code. Students routinely fix line 40
because the traceback mentioned it, when line 40 is only where a bad value
from line 12 finally surfaced.

For a stack trace, the deepest frame is where it broke; the frames above it
are how it got there. The bug is often in the caller.

## The faults that account for most student bugs

**C and C++**
- Array index off by one, and writing past the end of a buffer
- Using a pointer that was never allocated, or freed twice
- `scanf` without `&`, or a format specifier that does not match the type
- Integer division where a float was meant: `1/2` is `0`
- Missing `break` in a `switch`
- Comparing strings with `==` rather than `strcmp`

**Java**
- `NullPointerException`: name which reference was null and why
- `ArrayIndexOutOfBoundsException` from a `<=` in a loop bound
- Comparing strings with `==` rather than `.equals`
- Integer division, and overflow on `int` when `long` was needed
- Modifying a collection while iterating it

**Python**
- `IndentationError` from mixed tabs and spaces
- `None` returned because a function fell off the end without `return`
- Mutable default argument shared across calls
- Shadowing a builtin, such as naming a variable `list` or `sum`
- Off-by-one from `range` being exclusive at the top

## When the output is wrong but nothing crashes

Ask for the input used, the output produced, and the output expected. Then
bisect: find the earliest point where a value differs from what it should
be. Suggest printing that value rather than reading the whole program again.

## When it loops forever

The loop variable is not moving toward the exit condition, the condition
tests the wrong variable, or a recursive call never reaches a base case.
Check which, specifically.

## How to help

1. Say what the error means in one sentence.
2. Name the line and the cause.
3. Give the corrected code.
4. Say how to recognise this fault next time.

If the code has more than one fault, fix the one that stops it running
first, then mention the others. Do not rewrite their whole program in a
different style unless they ask.
