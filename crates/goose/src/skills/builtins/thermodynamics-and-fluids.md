---
name: thermodynamics-and-fluids
description: Solve thermodynamics and fluid mechanics problems including the first and second laws, steam and gas cycles, entropy, Bernoulli, pipe losses and dimensional analysis. Use for mechanical engineering coursework and lab calculations.
---

# Thermodynamics and fluid mechanics

## Define the system before anything else

State whether the system is closed (fixed mass) or open (a control volume
with flow), and whether the process is steady. Half of all wrong answers use
a closed-system energy equation on a turbine or nozzle, which is an open
system.

Then list what is held constant: isothermal, isobaric, isochoric, adiabatic,
or polytropic with its index.

## First law

Closed system: Q minus W equals the change in internal energy.

Open system, steady flow: the energy entering equals the energy leaving,
counting enthalpy, kinetic and potential energy, heat and shaft work. Drop
kinetic and potential terms only after checking they are small, and say that
you did.

Sign convention: heat into the system positive, work done by the system
positive. State it once and keep it.

## Property data

For steam, read the tables rather than treating it as an ideal gas. Check
the phase first by comparing the given pressure and temperature against the
saturation values. If the state is wet, find the dryness fraction and
interpolate properties from it. Interpolate linearly between table rows and
show the interpolation.

Ideal gas relations apply to air and similar gases well away from
saturation, not to steam near the dome.

## Second law

Entropy change of the universe is zero for a reversible process and positive
for a real one. Carnot efficiency is one minus the ratio of absolute
temperatures, and it is a ceiling: any claimed efficiency above it means an
arithmetic error. Use absolute temperature in kelvin everywhere in second
law work.

## Cycles

For Otto, Diesel, Brayton and Rankine, draw the p-V and T-s diagrams, number
the states, and tabulate properties at each before computing. Efficiency is
net work over heat supplied. For Rankine, remember pump work is small but
not zero.

## Fluid statics and Bernoulli

Pressure at depth is density times g times height. For Bernoulli, state the
assumptions you are relying on: steady, incompressible, along a streamline,
and no losses. Add the head loss term as soon as there is pipe friction,
because the frictionless form is not valid there.

## Pipe flow

Compute the Reynolds number first, since it decides everything after. Below
roughly 2300 the flow is laminar and the friction factor is 64 over
Reynolds. Above roughly 4000 it is turbulent, and the friction factor comes
from the Moody chart or the Colebrook equation using the relative roughness.
Add minor losses for bends, valves and sudden changes.

## How to help

Tabulate the state points. Carry units through every step and convert to SI
at the start. Check the answer against physical sense: an efficiency above
Carnot, a negative absolute temperature, or a velocity that implies
impossible flow all mean a mistake earlier.
