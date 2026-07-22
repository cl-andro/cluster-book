---
layout: chapter
title: "Chapter 21: Custom Memory Allocators"
permalink: /chapter21/
prev_chapter: /chapter20/
prev_title: "Chapter 20"
next_chapter: /chapter22/
next_title: "Chapter 22"
---

# Chapter 21: Custom Memory Allocators

While Cluster's default memory management handles most use cases gracefully, high-performance domains demand granular control over memory allocation. By seamlessly binding to C++ allocation patterns, Cluster allows you to implement custom memory allocators. This feature provides Python-like readability while unlocking bare-metal C++ efficiency, giving you complete control over memory layouts and allocation strategies.

---

## 1. Why Custom Allocators Matter

Custom allocators are essential for domains where standard heap allocation overhead is unacceptable. 

* **Game Engines**: Minimize latency spikes and fragmentation by pre-allocating memory pools.
* **Embedded Systems**: Fit within tight memory constraints and avoid dynamic allocation completely.
* **Arena Allocation**: Allocate complex node-based structures and free them entirely in one operation.
* **Debugging & Profiling**: Track allocation sizes, detect memory leaks, and profile allocation hotspots.

| Allocator Type | Best Use Case | Performance Characteristics |
| -------------- | ------------- | --------------------------- |
| Standard Heap  | General use   | Moderate speed, high fragmentation risk |
| Pool Allocator | Fixed size nodes | Very fast, zero fragmentation |
| Arena / Linear | Per-frame data   | Blazing fast allocation, bulk deallocation |
| Tracking       | Debugging        | Slower due to logging/tracking overhead |

---

## 2. Using Allocator-Aware Box Types

The `box[T]` type in Cluster represents a uniquely-owned pointer. For custom memory control, you can provide an allocator type as the second type argument. The syntax is `box[T, AllocType[T]]`.

```python
# Allocates a User instance using CustomAlloc
user_ptr := box[User, CustomAlloc[User]](User(id=1))
```

This enforces that the `box` will allocate and deallocate the memory using the specified `CustomAlloc[User]` type, bypassing the standard heap `new`/`delete` if defined so.

---

## 3. Using Allocator-Aware Vectors

Just like `box`, dynamically sized arrays can leverage custom allocators. The `vector` container accepts a second type parameter for the allocator: `vector[T, AllocType[T]]`.

```python
# A dynamic array powered by an ArenaAllocator
buffer := vector[int, ArenaAllocator[int]]()
```

This ensures every resizing operation of the vector relies strictly on your tailored memory strategy.

---

## 4. Defining a Custom Allocator via cpp_inject

To create an allocator, you inject raw C++ code satisfying the standard C++ allocator requirements. Here, we define a `VerboseAllocator` that logs allocations.

```python
cpp_inject "template <typename T> struct VerboseAllocator { \
    typedef T value_type; \
    VerboseAllocator() noexcept {} \
    template <typename U> VerboseAllocator(const VerboseAllocator<U>&) noexcept {} \
    T* allocate(std::size_t n) { \
        std::cout << \"[Alloc] \" << n << \" elements\\n\"; \
        return static_cast<T*>(::operator new(n * sizeof(T))); \
    } \
    void deallocate(T* p, std::size_t n) noexcept { \
        std::cout << \"[Dealloc]\\n\"; \
        ::operator delete(p); \
    } \
};"
```

---

## 5. How the Box Class Template Works Internally

Internally, `box[T, Allocator]` leverages C++ template metaprogramming to behave like a customized `std::unique_ptr`. However, unlike a standard `std::unique_ptr` which only takes a custom deleter, the allocator-aware box integrates a full stateful or stateless allocator for both creation and destruction, marrying Pythonic syntax with complex C++ memory mechanics.

---

## 6. Arrow Operator Auto-Detection

In Cluster, pointer dereferencing is delightfully simple. You do not need explicit `->` operators. When you access a property on a `box` type, such as `p.x`, the compiler automatically detects the pointer semantics and emits the corresponding C++ arrow operator (`p->x`).

```python
# p is a box[Point]
p := box[Point](Point(x=10, y=20))
# Automatically translates to p->x
val := p.x 
```

---

## 7. Complete Example: Verbose Allocation Tracking

Below is a complete, runnable example demonstrating a custom logging allocator applied to a `box`.

```python
cpp_inject "template <typename T> struct VerboseAllocator { \
    typedef T value_type; \
    VerboseAllocator() noexcept {} \
    template <typename U> VerboseAllocator(const VerboseAllocator<U>&) noexcept {} \
    T* allocate(std::size_t n) { \
        std::cout << \"[Alloc] \" << n << \" elements\\n\"; \
        return static_cast<T*>(::operator new(n * sizeof(T))); \
    } \
    void deallocate(T* p, std::size_t n) noexcept { \
        std::cout << \"[Dealloc]\\n\"; \
        ::operator delete(p); \
    } \
};"

model Point:
    x: int
    y: int

fn main():
    p := box[Point, VerboseAllocator[Point]](Point(x=10, y=20))
    put "x=" + to_text(p.x) + ", y=" + to_text(p.y)
```

Running this code will print allocation metrics before outputting the coordinates, perfectly blending Cluster's pristine syntax with uncompromised C++ control.
