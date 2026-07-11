---
layout: chapter
title: "Cluster-lang: Chapter 1 — The Basics"
permalink: /chapter1/
next_chapter: /chapter2/
next_title: "Chapter 2"
---

# Cluster-lang: Chapter 1 — The Basics

Welcome to Cluster-lang! Cluster is a high-performance systems and scripting language with Pythonic readability, C++ execution speed, and compile-time memory safety.

---

## 1. Variables & Declarations

In Cluster-lang, variables can be defined with implicit or explicit type declarations.

### Implicit Variable Declaration (`:=`)
By default, variables are declared and initialized using the `:=` operator. The compiler automatically infers the correct type:
```python
x := 42                // Inferred as int
name := "Alice"        // Inferred as string
is_valid := True       // Inferred as bool
pi := 3.1415           // Inferred as float
```

### Explicit Variable Declaration (`: type :=`)
If you want to enforce a specific type or help the compiler's static analysis, add a colon `:` followed by the type name:
```python
age: int := 25
price: float := 19.99
greeting: string := "Hello, World!"
```

### Constants (`constexpr` / `const`)
Constants are variables whose values cannot change after initialization. Prefix the declaration with `constexpr` or `const`:
```python
constexpr PI := 3.14159
constexpr MaxConnections: int := 100
```

---

## 2. Basic Data Types

Cluster-lang supports the following primitive types:

| Type | Description | C++ Under the Hood |
| :--- | :--- | :--- |
| `int` | Signed 64-bit integer | `int64_t` / `int` |
| `float` | 64-bit double-precision floating point | `double` / `float` |
| `string` | Text string | `std::string` |
| `bool` | Boolean (`True` or `False`) | `bool` |
| `void` | Empty/return-free type | `void` |

---

## 3. Basic Input / Output (`put`)

The `put` statement outputs values to the console, automatically appending a newline. You can pass variables, literals, or expressions:
```python
put "Hello, Alice!"
put 42 + 8
```

To concatenate strings and print them:
```python
name := "Bob"
put "Hello, " + name
```
