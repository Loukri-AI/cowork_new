---
name: circuit-analysis
description: Solve electrical and electronic circuits. Use this skill whenever the user asks to find a current, voltage, power or equivalent resistance, or mentions a circuit diagram. Also trigger on nodal analysis, mesh analysis, KCL, KVL, Thevenin, Norton, superposition, maximum power transfer, RC, RL and RLC transients, time constant, phasors, impedance, resonance, power factor, and on op-amp configurations (inverting, non-inverting, summing, integrator, differentiator).
---

# Circuit analysis

## Choosing a method

| Situation | Method |
|---|---|
| Few nodes, mostly current sources | Nodal analysis |
| Few loops, mostly voltage sources | Mesh analysis |
| One element's behaviour is wanted | Thevenin or Norton |
| Several independent sources, linear circuit | Superposition |
| Sinusoidal steady state | Phasors and impedance |

Count nodes and meshes first and pick whichever gives fewer equations.

## Nodal analysis

Pick the reference node, ideally the one with most connections. Write KCL at
every other node, taking currents as leaving the node. A voltage source
between two non-reference nodes forms a supernode: write KCL around the pair
and add the source equation relating them.

## Mesh analysis

Assign loop currents in the same direction, usually clockwise. Write KVL
around each mesh. A current source shared between two meshes forms a
supermesh: write KVL around the outside and add the source equation.

## Thevenin and Norton

1. Remove the load.
2. Find the open-circuit voltage across the terminals.
3. Find the resistance seen from the terminals with independent sources
   deactivated: voltage sources shorted, current sources opened.
4. If dependent sources are present, do not deactivate them. Apply a test
   source of 1V or 1A instead and compute the ratio.

Maximum power transfer occurs when the load equals the Thevenin resistance,
and in AC when the load is the complex conjugate of the Thevenin impedance.

## Transients

For a first-order circuit the answer always has the form

    x(t) = x_final + (x_initial - x_final) * exp(-t / tau)

with tau equal to RC or L/R, using the resistance seen by the capacitor or
inductor. Remember that capacitor voltage and inductor current cannot change
instantaneously, so read the initial condition from the instant before
switching.

## AC steady state

Work in phasors. Impedance of a resistor is R, of an inductor jwL, of a
capacitor 1/(jwC). Solve exactly as a DC circuit using complex arithmetic,
then convert back to the time domain. State whether magnitudes are peak or
RMS, and keep it consistent.

## Op-amps

For an ideal op-amp with negative feedback, assume no current into the
inputs and no voltage difference between them. That pair of assumptions
solves the standard inverting, non-inverting, summing, difference and
integrator configurations directly.

## How to help

Show the circuit equations before the arithmetic, since the method carries
the marks. State units at every step, and sanity-check the final answer
against an expected order of magnitude.
