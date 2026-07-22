---
layout: chapter
title: "Chapter 24: Cluster Containers (clc) & Declarative Sandboxing (.clc)"
permalink: /chapter24/
prev_chapter: /chapter23/
prev_title: "Chapter 23"
---

# Chapter 24: Cluster Containers (clc) & Declarative Sandboxing (.clc)

Cluster-lang provides built-in support for containerization and sandbox isolation. While advanced users can orchestrate sandboxes programmatically using the low-level `container` namespace, Cluster-lang introduces a specialized, ultra-lightweight declarative container configuration format: **`.clc` files**.

Compared to verbose, nested YAML configurations (like Docker Compose or GitHub Actions files), `.clc` is 50% smaller, much cleaner to read, and is compiled directly into a native binary by the toolchain.

---

## 1. Writing Declarative Sandboxes (`.clc`)

A `.clc` file defines a container sandbox declaratively without any procedural boilerplate. There are no manual directory skeleton mounts, no `defer` blocks, and no manual cleanups. The toolchain handles all mounts and teardowns automatically.

Here is a sample `.clc` file:

```yaml
# Sandbox configuration
name: test-runner
rootfs: /tmp/clc_sandbox
hostname: sandbox-guest
share_hardware: true

# Environment variables
env:
    STAGE=production
    DATABASE_URL=localhost:5432

# Commands to run in sequence
run:
    "echo Starting workflow..."
    "hostname"
    "env | grep STAGE"
```

To compile and run this sandbox, invoke it directly through the compiler:
```bash
cl run my_sandbox.clc
```

---

## 2. Under the Hood: Transparent Translation

When the compiler detects a `.clc` file, it translates it transparently into a high-performance Cluster script under the hood, compiles it to native C++, and executes it. 

The generated script maps the configuration keys to the built-in `container` standard library namespace:

```python
fn main():
    // Generated automatically from config keys
    c := container::create("test-runner", "/tmp/clc_sandbox", "sandbox-guest")
    c.provision_skeleton()
    
    // Automatically bind-mounts essential host binaries read-only
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    c.mount_proc()
    
    // Automatically shares device nodes for GPU/CUDA if share_hardware is true
    c.share_hardware()
    
    // Injects environment variables
    cpp_inject "setenv(\"STAGE\", \"production\", 1);"
    cpp_inject "setenv(\"DATABASE_URL\", \"localhost:5432\", 1);"
    
    // Runs commands sequentially
    c.run("echo Starting workflow...")
    c.run("hostname")
    c.run("env | grep STAGE")
    
    // Guarantees clean lazy unmounting and directory deletion
    c.cleanup()
```

---

## 3. Direct Hardware Passthrough & Dev Mapping

Unlike traditional VMs or emulators (like Termux on Android), Cluster Containers run directly on the host kernel. 

By setting `share_hardware: true`, the container binds the host's `/dev` directory inside the sandbox. This gives the sandboxed execution script direct access to host GPU drivers (CUDA/NVIDIA), USB controllers, and physical interfaces without virtualization overhead or speed penalties.

---

## 4. Comparison: `.clc` vs. Docker YAML

| Feature | Cluster Declarative `.clc` | Docker Compose YAML |
| :--- | :--- | :--- |
| **Code Size** | Very compact (No boilerplate, implicit mounts) | Verbose (Needs explicit volume & image mapping) |
| **Typing & Validation** | Compiled and checked at JIT time | Static, parsed at runtime |
| **Daemon Overhead** | Zero (Runs as standard host process) | Requires active Docker/Podman Daemon |
| **Cleanup Guarantee** | Self-destructs vacuum directory immediately | Requires manual prune/image deletion |

---

## 5. Advanced Programmable Container Orchestration

For custom workflows that require loops, conditionals, or complex mount systems, developers can write raw Cluster-lang scripts (`.cl` or `.zk`) utilizing the low-level `container` namespace APIs:

```python
import std::container as container

fn execute_custom_sandbox(sandbox_path: string) -> int:
    c := container::create("custom-runner", sandbox_path, "custom-host")
    
    // Register auto-cleanup
    defer c.cleanup()
    
    c.provision_skeleton()
    
    // Dynamic bind mounts
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    c.mount_proc()
    
    // Execute isolated task
    return c.run("/bin/sh -c 'echo Inside custom sandbox'")
```
