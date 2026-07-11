---
layout: chapter
title: "Cluster-lang: Chapter 4 — Memory Safety & Ownership"
permalink: /chapter4/
prev_chapter: /chapter3/
prev_title: "Chapter 3"
next_chapter: /chapter5/
next_title: "Chapter 5"
---

# Cluster-lang: Chapter 4 — Memory Safety & Ownership

Cluster-lang provides strict compile-time safety checks resembling Rust, but with a highly simplified memory management model that hides lifetime complexity.

---

## 1. Non-Nullability by Default

In Cluster-lang, variables are non-nullable by default. They must be initialized with a value and cannot be assigned `None` or `nullptr`:
```python
name: string = "Alice"      // Valid
name = None                 // Compile-time Type Mismatch Error!
```

---

## 2. Optional Types (`?`)

If you want a variable to be nullable, append a `?` suffix to its type. Optional variables can be initialized or assigned `None`:
```python
email: string? := None      // Valid optional string
email = "alice@example.com" // Assign a value
email = None                // Can be set back to None
```
Optional variables can be unwrapped using optional chaining (`?.`) or fallback using null coalescing (`??`).

---

## 3. Box Pointers (`box[T]`)

A `box[T]` is a heap-allocated unique pointer that owns the underlying resource `T`. 
- Only **one** variable can own a box pointer at a time.
- When the owner goes out of scope, the heap resource is automatically deleted (zero memory leaks).

```python
x := box 42                 // Heap-allocated unique integer box
```

---

## 4. Ownership Transfer & Move Semantics (`move()`)

To transfer ownership of a resource (like a `box[T]` pointer or other custom resource), you must explicitly use the `move()` function:
```python
val1 := box 100
val2 := move(val1)          // Ownership transferred to val2
```

### Compile-Time Use-After-Move Protection
If you try to access a variable after its ownership has been transferred, the Cluster compiler throws a compile-time safety error:
```python
val1 := box 100
val2 := move(val1)
put *val1                  // Compile Error: Use of moved variable 'val1'
```
This guarantees memory safety and prevents double-free errors.
