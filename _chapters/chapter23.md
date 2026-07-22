---
layout: chapter
title: "Chapter 23: Pattern Matching, Channel Select & Defer"
permalink: /chapter23/
prev_chapter: /chapter22/
prev_title: "Chapter 22"
next_chapter: /chapter24/
next_title: "Chapter 24"
---

# Chapter 23: Pattern Matching, Channel Select & Defer

Cluster brings high-level expressiveness to systems programming. In this chapter, we explore three powerful control flow constructs: pattern matching for algebraic data types (ADTs), channel multiplexing for concurrent communication, and deferred execution for resource management. These features provide Pythonic readability while compiling down to C++'s bare-metal performance.

---

## 1. Pattern Matching with `match`

Cluster provides a robust `match` statement for elegant control flow, heavily inspired by Rust's exhaustive pattern matching on ADTs. It allows developers to safely unwrap enum variants and extract their inner values without boilerplate type checks.

Consider an enum `Result` that encapsulates either a successful string value or an integer error code. The `match` statement enforces comprehensive handling of all variants:

```python
enum Result:
    Ok(val: string)
    Err(code: int)

fn process_result(r: Result):
    match r:
        Ok(v):
            put "Got: " + v.val
        Err(e):
            put "Error code: " + to_text(e.code)

fn main():
    r := Result::Ok(val="Success")
    process_result(r)
```

---

## 2. Channel Multiplexing with `select`

For concurrent applications, Cluster embraces Go-like channel primitives. The `select:` block allows a single goroutine to wait on multiple communication operations simultaneously. It blocks until one of its cases can proceed, providing a seamless way to handle asynchronous I/O and multiplex channels.

The syntax supports receiving (`case v := <-ch:`), sending (`case ch <- val:`), and non-blocking fallbacks (`default:`).

```python
fn multiplexer():
    ch1 := channel[string]()
    ch2 := channel[int]()
    
    // In a real application, these channels would be populated concurrently
    
    select:
        case msg := <-ch1:
            put "From ch1: " + msg
        case num := <-ch2:
            put "From ch2: " + to_text(num)
        default:
            put "No data ready"
```

---

## 3. Deferred Cleanup with `defer`

Resource leaks are a common pitfall in C/C++. Cluster tackles this with the `defer` statement, which schedules a function call or statement to be executed immediately before the surrounding scope exits. Deferred statements are executed in Last-In-First-Out (LIFO) order.

Under the hood, Cluster transpiles `defer` statements to zero-cost C++17 RAII (Resource Acquisition Is Initialization) helpers utilizing CTAD (Class Template Argument Deduction), ensuring deterministic destruction without runtime overhead.

```python
fn perform_work():
    defer put "Cleanup 3 (last)"
    defer put "Cleanup 2"
    defer put "Cleanup 1 (first)"
    put "Main logic executing..."
    // Output: 
    // Main logic executing...
    // Cleanup 1 (first)
    // Cleanup 2
    // Cleanup 3 (last)
```

---

## 4. Complete Example

Let's combine pattern matching, select multiplexing, and defer into a realistic scenario handling mock network responses and resource cleanup.

```python
enum Response:
    Data(payload: string)
    Timeout(reason: string)

fn handle_connection(data_ch: channel[Response], quit_ch: channel[bool]):
    defer put "Connection closed. Releasing socket resources."
    defer put "Flushing buffers..."
    
    put "Listening for incoming data..."
    
    select:
        case res := <-data_ch:
            match res:
                Data(d):
                    put "Received data: " + d.payload
                Timeout(t):
                    put "Connection timed out: " + t.reason
        case <-quit_ch:
            put "Termination requested by client."
        default:
            put "Idle: waiting for events."
            
fn main():
    data_ch := channel[Response]()
    quit_ch := channel[bool]()
    
    // Simulating a non-blocking poll with no data ready
    handle_connection(data_ch, quit_ch)
```
