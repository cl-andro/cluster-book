---
layout: chapter
title: "Cluster-lang: Chapter 3 — Models & Object Orientation"
permalink: /chapter3/
prev_chapter: /chapter2/
prev_title: "Chapter 2"
next_chapter: /chapter4/
next_title: "Chapter 4"
---

# Cluster-lang: Chapter 3 — Models & Object Orientation

Cluster-lang provides clean struct and class modeling using the `model` keyword. 

---

## 1. Defining Models

Models hold fields (properties) and methods:
```python
model Address:
    city: string
    zipcode: int

model User:
    name: string
    address: box[Address]    // box pointer to Address model

    fn get_city() -> string:
        // Methods can access local fields
        if self.address == None:
            return "Unknown"
        return self.address.city
```

---

## 2. Instantiating Models

To instantiate a model, use the `box` keyword (which wraps it in a unique-pointer heap allocation) or construct it inline:
```python
// 1. Create a heap-allocated Address
addr := box Address(city="New York", zipcode=10001)

// 2. Pass it to a User instance (note the move semantics for boxes!)
user := box User(name="John", address=move(addr))
```

---

## 3. Optional Chaining (`?.`)

To access fields or call methods on potentially null reference pointers without manual nested `if` statements, use the optional chaining (`?.`) operator:
```python
// If user or user.address is None, this safely evaluates to None without crashing!
city_name := user?.address?.city
```
If any reference along the chain evaluates to `None`, the execution stops and evaluates to `None` immediately.

---

## 4. Null Coalescing (`??`)

The null coalescing operator (`??`) evaluates to the left-hand operand if it is not null/empty, or returns the fallback right-hand value otherwise:
```python
// Checks if city_name is None or empty. If so, defaults to "Unknown City"
current_city := city_name ?? "Unknown City"
```

### Combining Optional Chaining & Null Coalescing
You can combine these two operators to write bulletproof, concise member access pipelines:
```python
city := user?.address?.city ?? "Default City"
put city
```
This evaluates to the city name if the path is fully valid, or defaults safely to `"Default City"`.
