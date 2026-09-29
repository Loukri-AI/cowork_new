---
name: embedded-systems
description: Write and debug firmware for Arduino, ESP32, STM32, 8051 or Raspberry Pi, including GPIO, timers, interrupts, ADC, PWM and serial protocols. Use for electronics lab work, mini projects, or microcontroller coursework.
---

# Microcontroller firmware

## Ask these before writing code

Which board, which toolchain, and what is physically wired. Firmware advice
is wrong if the pin numbering or the clock source is assumed. On ESP32 in
particular, not every pin can do every job: several are input-only, and some
are strapping pins that must not be held at the wrong level during boot.

## Wiring faults that look like software faults

Check these before debugging the code. They account for most "my sensor
reads garbage" reports.

- No common ground between the board and the peripheral
- A 5V sensor wired to a 3.3V-only input, which needs a level shifter
- Missing pull-up resistors on an I2C bus
- A motor or servo drawing current through the board's regulator instead of
  its own supply, which browns out the microcontroller mid-operation
- A floating input read as a button, with no pull-up or pull-down

## Interrupt service routines

Keep them short. Inside an ISR: do not call delay, do not print, do not
allocate. Set a flag or push to a buffer and handle it in the main loop.

Any variable shared between an ISR and the main loop must be declared
`volatile`, or the compiler may cache it in a register and the main loop
will never see the change. On a multi-byte variable, also guard the read
against being interrupted halfway.

## Blocking delays

`delay()` stops everything. Once a program needs to do two things at once,
replace it with a millis-based check:

```c
if (millis() - lastRun >= interval) {
    lastRun = millis();
    // periodic work
}
```

This subtraction is correct even when `millis()` overflows, provided both
variables are `unsigned long`.

## Serial protocols

- **UART**: both sides must agree on baud rate. Garbled characters almost
  always mean a mismatch, or a missing common ground.
- **I2C**: needs pull-ups, and every device needs a distinct address. Scan
  the bus first to confirm the device answers at all.
- **SPI**: check clock polarity and phase, and that chip select is driven
  low for the whole transaction.

## ADC

Note the resolution and the reference voltage before converting a reading to
a real quantity. On Arduino Uno it is 10 bits against 5V; on ESP32 it is 12
bits against a reference that is not perfectly linear, so calibrate it.

## How to help

Give complete, compilable code with the pin assignments at the top as named
constants. State the board it targets. Include the wiring in words. After
the code, list what to check if it does not work, starting with the physical
faults above.
