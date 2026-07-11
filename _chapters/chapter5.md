---
layout: chapter
title: "Cluster-lang: Chapter 5 — Concurrency & Channels"
permalink: /chapter5/
prev_chapter: /chapter4/
prev_title: "Chapter 4"
next_chapter: /chapter6/
next_title: "Chapter 6"
---

# Cluster-lang: Chapter 5 — Concurrency & Channels

Cluster-lang supports high-performance concurrency through lightweight green threads and copyable thread-safe communication channels.

---

## 1. Spawning Green Threads (`spawn`)

Green threads (lightweight fibers) are spawned using the `spawn` keyword. They run asynchronously on the compiler's worker thread pool.

### Spawning a Function
```python
fn calculate(id: int):
    put "Task started:"
    put id

fn main():
    spawn calculate(1)      // Run calculate(1) asynchronously
    spawn calculate(2)      // Run calculate(2) asynchronously
```

### Spawning a Block of Code
You can also spawn an inline block of code using `spawn:` statement:
```python
fn main():
    spawn:
        put "Task runs in thread pool"
```

---

## 2. Channels (`Channel[T]`)

Channels allow safe, synchronized data communication between different green threads without race conditions.

### Declaring a Channel
Declare a channel by specifying the generic type parameters and capacity:
```python
ch := Channel[int](10)      // Channel holding integers, capacity = 10
```

### Sending and Receiving Data
- `ch.send(value)`: Sends data into the channel (blocks if the channel capacity is full).
- `ch.recv()`: Receives data from the channel (blocks if no data is available).

```python
fn worker(ch: Channel[int]):
    ch.send(42)            // Sends 42 into the channel

fn main():
    ch := Channel[int](5)
    spawn worker(ch)
    
    val := ch.recv()       // Blocks until data is received
    put val                // Prints 42
```
Channels are pass-by-value/copyable safe and reference-counted under the hood, making them safe to copy and pass to spawned lambdas.
