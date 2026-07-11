---
layout: chapter
title: "Cluster-lang: Chapter 2 — Control Flow & Functions"
permalink: /chapter2/
prev_chapter: /chapter1/
prev_title: "Chapter 1"
next_chapter: /chapter3/
next_title: "Chapter 3"
---

# Cluster-lang: Chapter 2 — Control Flow & Functions

This chapter covers conditionals, loops, standard functions, arrow functions, and implicit returns.

---

## 1. Conditionals (`if`, `elif`, `else`)

Cluster-lang uses standard Pythonic indentation and keywords for conditionals. Condition expressions do not require parentheses:
```python
x := 10

if x > 15:
    put "x is large"
elif x > 5:
    put "x is medium"
else:
    put "x is small"
```

---

## 2. Loops (`while`, `for`)

### While Loops
A `while` loop runs as long as a condition evaluates to true:
```python
i := 0
while i < 5:
    put i
    i = i + 1
```

### For Loops
`for` loops iterate over a range of numbers. The syntax follows: `for variable in range(start, end, step)`:
```python
// Prints 0, 1, 2, 3, 4
for i in range(0, 5):
    put i

// Prints 0, 2, 4 (step = 2)
for j in range(0, 5, 2):
    put j
```

---

## 3. Functions

Functions are defined using the `fn` keyword.

### Standard Function
Specify parameter names with types, and the return type using the `->` arrow:
```python
fn add(a: int, b: int) -> int:
    return a + b
```

### Arrow Functions (Lambdas)
For concise callback logic or math expressions, use the arrow function syntax:
```python
// Multi-parameter arrow function
add := (a, b) => a + b

// Single-parameter arrow function (parentheses optional)
square := x => x * x

put add(5, 3)     // Prints 8
put square(4)     // Prints 16
```

### Implicit Returns
For single-expression functions, you can omit both the `return` keyword and block indentations. The expression value is automatically returned:
```python
fn multiply(a: int, b: int) -> int: a * b
```
Under the hood, the compiler prepends `return` to `a * b`, compiling it directly as `return a * b;` in C++.
