---
name: digital-design-hdl
description: Write and explain Verilog or VHDL, and work through digital logic topics such as Boolean simplification, K-maps, combinational and sequential circuits, counters and state machines. Use for digital electronics coursework and HDL lab work.
---

# Digital design and HDL

## Boolean simplification

For up to four variables use a Karnaugh map; beyond that use
Quine-McCluskey. Group in powers of two, take the largest groups possible,
and allow groups to overlap and to wrap around the edges. Mark don't-care
terms and use them only when they enlarge a group.

Always state whether the result is sum-of-products or product-of-sums, since
exam questions usually demand one specific form.

## The single most important HDL rule

Use blocking and non-blocking assignment correctly, because getting this
wrong produces code that simulates one way and synthesises another.

- **Sequential logic** (inside `always @(posedge clk)`): use `<=`,
  non-blocking.
- **Combinational logic** (inside `always @(*)`): use `=`, blocking.

Never assign to the same signal from two different `always` blocks.

## Avoiding accidental latches

In a combinational block, every output must be assigned on every path. An
`if` without an `else`, or a `case` without a `default`, infers a latch that
you did not intend and that will not meet timing. Assign default values at
the top of the block, then override them.

## State machines

Write them in the three-block style: one sequential block for the state
register, one combinational block for next-state logic, one for outputs.
Name the states with parameters or an enumerated type rather than raw
numbers. Say whether the machine is Moore (outputs depend on state only) or
Mealy (outputs also depend on inputs), because the timing differs by a
cycle.

## Reset

Decide synchronous or asynchronous and apply it consistently. Every flip
flop that holds state the design depends on at startup needs one.

## Testbenches

A testbench has no ports. Generate the clock with an `always` block, drive
the inputs, and check outputs against expected values rather than only
eyeballing a waveform. Include the reset sequence at the start.

## How to help

Give synthesisable code, and say explicitly when something is
simulation-only. Include a testbench when the student is doing lab work.
For K-map questions, draw the map in a table and show the groupings, since
the working carries the marks.
