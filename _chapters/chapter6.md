---
layout: chapter
title: "Cluster-lang: Chapter 6 — Async Programming & Metaprogramming"
permalink: /chapter6/
prev_chapter: /chapter5/
prev_title: "Chapter 5"
next_chapter: /chapter7/
next_title: "Chapter 7"
---

# Cluster-lang: Chapter 6 — Async Programming & Metaprogramming

This chapter covers asynchronous programming (`async`/`await`), decorators, and reflection in Cluster-lang.

---

## 1. Asynchronous Programming (`async` / `await`)

For high-throughput, non-blocking I/O tasks, Cluster-lang provides async coroutines.

### Defining Async Functions
Define an async function by prefixing it with the `async` keyword:
```python
async fn fetch_data(url: string) -> string:
    // Simulated network I/O
    delay(100)
    return "Data from " + url
```

### Awaiting Async Functions
To suspend execution until an async task finishes, use the `await` keyword:
```python
fn main():
    task := fetch_data("https://api.example.com")
    result := await task
    put result
```
Under the hood, async operations are transpiled to cooperative C++ futures and coroutines using modern C++20 `std::coroutine`.

---

## 2. Metaprogramming & Decorators

Decorators allow you to modify or monitor the behavior of functions and models at compile-time or runtime.

### Using Decorators
Decorators are prefixed with the `@` symbol and placed directly above function declarations:
```python
@log_execution
fn process(data: int) -> int:
    return data * 2
```

### Property Descriptors
You can use decorators to attach properties, getters, or setters to model fields:
```python
model Product:
    @readonly
    id: int
    
    @property
    price: float
```

---

## 3. Reflection & Introspection

Cluster-lang provides metadata introspection capabilities so program structures can query their own attributes at runtime.

### Inspecting Models
You can retrieve the name, fields, and types of fields on any model instance:
```python
model User:
    name: string
    age: int

fn main():
    u := box User(name="Alice", age=30)
    
    // Introspection query
    put u.__name__            // Prints "User"
    put u.__fields__          // Prints ["name", "age"]
```
This is extremely useful for building automatic JSON serializers/deserializers, database ORMs, and loggers.
