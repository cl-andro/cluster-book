---
layout: chapter
title: "Cluster-lang: Chapter 8 — Tensor Math & Hardware Peripherals"
permalink: /chapter8/
prev_chapter: /chapter7/
prev_title: "Chapter 7"
next_chapter: /chapter9/
next_title: "Chapter 9"
---

# Cluster-lang: Chapter 8 — Tensor Math & Hardware Peripherals

This chapter covers Cluster-lang's native capabilities for fast multidimensional tensor computations (AI/ML) and direct bare-metal hardware controls.

---

## 1. Tensor Mathematics (`Tensor`)

Cluster-lang provides built-in, highly optimized multidimensional arrays (`Tensor`) designed for AI pipelines, machine learning, and high-performance scientific simulations.

### Creating Tensors
Declare a tensor by specifying its shape and dimensions:
```python
// Creates a 2x3 tensor initialized to 0.0
t1 := Tensor(shape=[2, 3])
```

### Basic Math Operations
Tensors support fast matrix addition, scalar multiplication, and dot products:
```python
t1 := Tensor(shape=[2, 2])
t1.set(row=0, col=0, val=1.0)
t1.set(row=0, col=1, val=2.0)

t2 := Tensor(shape=[2, 2])
t2.set(row=0, col=0, val=3.0)
t2.set(row=0, col=1, val=4.0)

// Fast matrix multiplication (dot product)
t3 := t1.matmul(t2)
```

---

## 2. Embedded Systems & Hardware Controls

Cluster-lang compiles directly to native machine code without virtual machines or heavy runtime baggage, making it exceptionally suited for microcontrollers (Arduino, STM32, ESP32) and single-board computers (Raspberry Pi).

### Native GPIO Controls
Cluster-lang standard library provides native commands for digital pin configuration and operations:
*   `pinMode(pin, mode)`: Sets a GPIO pin as `0` (INPUT) or `1` (OUTPUT).
*   `digitalWrite(pin, state)`: Writes `0` (LOW) or `1` (HIGH) to a pin.
*   `delay(ms)`: Pauses execution for a specified duration in milliseconds.

```python
fn main():
    put "Initializing LED Pin..."
    pinMode(18, 1)            // Set GPIO Pin 18 to OUTPUT mode
    
    while True:
        digitalWrite(18, 1)   // LED ON
        delay(500)            // Wait 500ms
        digitalWrite(18, 0)   // LED OFF
        delay(500)            // Wait 500ms
```
When compiling for microcontrollers (using `--target esp32` or `--target arduino`), the compiler automatically bundles the required hardware cross-compilation header libraries.
