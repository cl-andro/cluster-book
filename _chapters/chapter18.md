---
layout: chapter
title: "Chapter 18: Dual-Semantics Ownership & Lifetime Safety"
permalink: /chapter18/
prev_chapter: /chapter17/
prev_title: "Chapter 17"
---

# Chapter 18: Dual-Semantics Ownership & Lifetime Safety

Cluster-lang provides a unique, vibrant hybrid memory management system that bridges the gap between Rust-like compile-time ownership safety and C++'s familiar value/copy semantics. This system is called **Dual-Semantics Ownership**.

By default, variables in Cluster-lang use standard C++ copy, assignment, and pass-by-value/pass-by-reference semantics. However, by decorating variables and parameters with ownership qualifiers (`owned`, `borrow`, `mut borrow`), you can opt-in to strict compile-time borrow checker checks on resources, guaranteeing lifetime safety.

---

## 1. Ownership & Reference Qualifiers

Cluster-lang defines three key type qualifiers for memory safety:

| Qualifier | C++ Mapping | Semantics |
| :--- | :--- | :--- |
| `owned T` | `T` | The variable has exclusive ownership of the resource. Moving it invalidates the original variable. |
| `borrow T` | `const T&` | Read-only borrow. Accesses the resource via a const reference. |
| `mut borrow T` | `T&` | Mutable borrow. Allows in-place mutation of the resource. |

If no qualifier is specified, the type defaults to standard copy-on-assignment/pass-by-value semantics.

---

## 2. Compile-Time Move Semantics

When a variable is declared as `owned`, assigning it to another variable or passing it as a function argument transfers (moves) its ownership:

```python
model Data:
    val: int

fn consume(d: owned Data):
    put d.val

fn main():
    x: owned Data = Data(val=42)
    consume(x) // Ownership of x is moved to the consume function.
```

### Static Use-After-Move Protection
The compiler's static analysis engine tracks ownership states. Attempting to read, assign, or borrow a variable after its ownership has been moved triggers a compile-time linter error:

```python
fn main():
    x: owned Data = Data(val=42)
    consume(x)
    consume(x) // Compile-time Error: Use of moved value: x
```

Under the hood, the transpiler converts compile-time moves of `owned` resources into C++ `std::move()` operations, ensuring zero-overhead move semantics at runtime.

---

## 3. Borrowing Rules (Shared vs. Mutable)

To access a resource without taking ownership, you can borrow it using `borrow` or `mut borrow`. The compiler enforces the aliasing safety rule:

* **Many Immutable Borrows:** You can have multiple active `borrow` references to a resource at the same time.
* **One Mutable Borrow:** If a resource is borrowed via `mut borrow`, no other active borrows (shared or mutable) are allowed.

```python
fn inspect(d: borrow Data):
    put d.val

fn main():
    x: owned Data = Data(val=10)
    inspect(x) // Valid read-only borrow
    consume(x) // Valid move
```

---

## 4. Unsafe Safety Bypass (`unsafe:`)

In performance-critical systems or low-level driver development, you may need to bypass the strict compile-time borrow checker to execute raw pointers, manual copies, or multiple mutable references.

Wrapping the code in an `unsafe:` block disables the ownership linter checks within that scope, while keeping the rest of the application safe:

```python
fn main():
    x: owned Data = Data(val=100)
    
    unsafe:
        // These statements are allowed inside unsafe block
        consume(x)
        consume(x) // Bypassed use-after-move checker!
```

---

## 5. Complete Example: Hybrid Memory Model

This complete program demonstrates how standard copy semantics and strict ownership rules seamlessly live side-by-side in the same codebase:

```python
model Window:
    title: string

# 1. Takes ownership of the window
fn close_window(w: owned Window):
    put "Closing window: " + w.title

# 2. Borrows the window read-only
fn render_window(w: borrow Window):
    put "Rendering window: " + w.title

fn main():
    # Strict Owned Semantics
    w1: owned Window = Window(title="Main Frame")
    render_window(w1)
    close_window(w1) // Moved!
    
    # Standard Value Copy Semantics (No Qualifiers)
    w2: Window = Window(title="Copy Frame")
    w3 := w2 // Copies the window data (standard C++)
    render_window(w2) // w2 is still valid!
    render_window(w3) // w3 is also valid!
```
