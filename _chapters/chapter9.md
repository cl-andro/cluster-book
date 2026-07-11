---
layout: chapter
title: "Cluster-lang: Chapter 9 — AI-First Compiler Features"
permalink: /chapter9/
prev_chapter: /chapter8/
prev_title: "Chapter 8"
next_chapter: /chapter10/
next_title: "Chapter 10"
---

# Cluster-lang: Chapter 9 — AI-First Compiler Features

This chapter explains Cluster-lang's unique compiler features designed specifically for AI models (LLMs) and developers to achieve maximum execution speeds and automated debugging.

---

## 1. The Dynamic `any` Type with C++20 Variant Backing

Cluster-lang provides an `any` type for variables whose types can change at runtime. Unlike slow interpreted languages, Cluster-lang implements this with high-performance stack-allocated C++20 variants (`ClusterAny`), avoiding costly heap allocations and garbage collection.

```python
x: any = 42
put x          // Prints 42

x = "Hello, Cluster!"
put x          // Prints Hello, Cluster!
```

---

## 2. Static Type Promotion Pass (Zero Overhead)

If a variable declared as `any` is assigned uniform types (e.g. only numbers), the Cluster compiler performs **Static Type Promotion**.

```python
y: any = 3.14
y = 1.5
```
At build time, the typechecker recognizes that `y` is only ever assigned double-precision floating-point values. It optimizes `y`'s transpiled type to a native C++ `double`, executing at full hardware speed without any runtime type-check penalty.

---

## 3. Auto-Import Resolution

To prevent compilation failures and simplify code writing, the compiler automatically exposes and resolves standard package namespaces:
*   `db` (Databases)
*   `fs` (Filesystem)
*   `json` (JSON parser & serializer)
*   `sys` (System variables and processes)
*   `tensor` (Tensor operations)

You can call standard methods immediately without writing manual `import` headers:
```python
fn main():
    content := fs.read("data.txt")
    put content
```

---

## 4. Structured JSON Diagnostics (`--json-errors`)

For AI code editors and automated build agents, the compiler supports a structured output flag.
Executing compilation with the `--json-errors` flag formats parser syntax and typechecker diagnostics into a structured JSON array:

```bash
python3 run.py my_code.cl --json-errors
```

**Example output:**
```json
[
  {
    "line": 12,
    "column": 5,
    "type": "TypeError",
    "message": "Cannot assign string to integer variable 'count'"
  }
]
```
This enables LLMs and IDE extensions to parse and automatically correct errors instantly.

---

## 5. Global `input()` function

For receiving console input from users, Cluster-lang provides a simple, global built-in function `input(prompt)` that matches standard developer conventions:

```python
fn main():
    name := input("Enter name: ")
    put "Hello, " + name
```
The prompt is displayed on standard output, and the function reads a single line from standard input.
