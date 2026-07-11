---
layout: chapter
title: "Cluster-lang: Chapter 7 — Database & Table Queries"
permalink: /chapter7/
prev_chapter: /chapter6/
prev_title: "Chapter 6"
next_chapter: /chapter8/
next_title: "Chapter 8"
---

# Cluster-lang: Chapter 7 — Database & Table Queries

Cluster-lang features a built-in lightweight SQL database engine (powered by SQLite) directly integrated into the language syntax and standard library.

---

## 1. Initializing Databases

You can open or create an in-memory or file-based database instance:
```python
// Opens a file-based SQLite database
db := DB("app.db")
```

---

## 2. Defining Tables

To declare a table schema, define a model and register it as a database table:
```python
model Employee:
    id: int
    name: string
    salary: float

// Create table inside the database matching the Employee model layout
db.create_table[Employee]()
```

---

## 3. Querying & Manipulating Data

Cluster-lang provides native methods for inserting, updating, and querying table records.

### Inserting Records
```python
emp1 := box Employee(id=1, name="Alice", salary=75000.0)
db.insert(move(emp1))
```

### Querying Records (ORM-style)
Query records using clean filtration predicates:
```python
// Retrieve employees earning more than 50,000
results := db.query[Employee]("salary > 50000")

for emp in results:
    put emp.name
    put emp.salary
```

### Direct SQL Execution
For complex queries, you can run raw SQL directly:
```python
db.execute("UPDATE Employee SET salary = salary * 1.1 WHERE id = 1")
```
This native DB integration makes Cluster-lang an exceptional fit for building fast, self-contained, microservice backends without external library overhead.
