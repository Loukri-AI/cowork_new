---
name: engineering-mechanics
description: Solve statics and dynamics problems including free body diagrams, trusses, friction, centroids, moments of inertia, kinematics and work-energy methods. Use for engineering mechanics and strength of materials coursework.
---

# Engineering mechanics

## Always start with a free body diagram

Most lost marks trace to a missing or wrong free body diagram. Draw one
before any equation, and on it mark:

- Every applied load with its direction
- Every reaction, with the right number of components for the support
- Self-weight, when it is not negligible
- A clear coordinate system and sign convention

Support reactions by type: a roller gives one reaction normal to the
surface; a pin gives two components; a fixed support gives two components
and a moment.

## Statics

Equilibrium is the sum of forces in x equals zero, the sum of forces in y
equals zero, and the sum of moments about any point equals zero. Take
moments about a point where an unknown acts, so that unknown drops out and
one equation gives one answer.

Check determinacy first. If the unknowns outnumber the equations the
structure is statically indeterminate and needs compatibility conditions.

## Trusses

Assume every member carries only axial force, tension positive.

- **Method of joints**: for all member forces. Start at a joint with at most
  two unknowns.
- **Method of sections**: for a few specific members. Cut through at most
  three unknown members and take moments to isolate one.

Identify zero-force members first: at an unloaded two-member joint both are
zero, and at an unloaded three-member joint where two are collinear, the
third is zero. This removes much of the work before it starts.

## Friction

Impending motion means friction equals mu times the normal force. Below
that, friction is whatever equilibrium requires, up to that maximum. Decide
which case applies before writing equations, and check whether the body
slides or tips by comparing the required friction with the tipping moment.

## Centroids and moments of inertia

Split the shape into standard parts, tabulate area and centroid for each,
and use the parallel axis theorem to move each part's inertia to the common
axis. Subtract holes as negative areas. Tabulating is worth the time because
it makes arithmetic errors visible.

## Dynamics

Choose the method by what is asked:

- Force and acceleration at an instant: Newton's second law
- Speed over a distance: work-energy
- Velocity over a time interval, or impact: impulse-momentum

For rigid body rotation remember that the moment of inertia is about the
axis of rotation, and use the parallel axis theorem when it is not centroidal.

## How to help

Draw the free body diagram in words or a diagram before solving. Carry units
through. State the sign convention once and hold to it. Give the final
answer with its direction or sense, not only a magnitude.
