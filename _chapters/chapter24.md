---
layout: chapter
title: "Chapter 24: Cluster Containers (clc) & Vacuum Sandboxing"
permalink: /chapter24/
prev_chapter: /chapter23/
prev_title: "Chapter 23"
---

# Chapter 24: Cluster Containers (clc) & Vacuum Sandboxing

Cluster-lang provides built-in, first-class support for programmatic containerization and filesystem isolation via the `container` namespace. Instead of relying on heavy daemons (like the Docker daemon) and static, error-prone YAML configurations (like Docker Compose or GitHub Actions files), Cluster-lang allows developers to define, run, and clean up container sandboxes directly using type-safe, compiled scripts.

---

## 1. Programmable Sandboxes (`container::create`)

The `container` namespace maps directly to low-level Linux kernel primitives. A sandbox is initialized as a "vacuum chamber" directory. When executed, the sandbox uses Linux mount and PID namespaces to isolate the running process.

```python
fn main():
    // 1. Initialize a sandbox container context
    c := container::create("sandbox-env", "/tmp/my_root", "sandbox-host")
    
    // 2. Setup standard directories
    c.provision_skeleton()
    
    // 3. Bind mount dynamic libraries and tools from host (read-only)
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    
    // 4. Mount procfs so tools like ps work
    c.mount_proc()
```

---

## 2. Direct Hardware Passthrough

Unlike traditional virtual machines or restricted sandboxes (e.g., Termux on Android), Cluster Containers run natively on the host Linux kernel. They can access physical hardware devices (like GPUs, CUDA cores, audio cards, and USB controllers) with zero performance degradation.

This is achieved by calling `c.share_hardware()`, which mounts the host's `/dev` nodes directly into the containerized environment:

```python
fn main():
    c := container::create("gpu-runner", "/tmp/gpu_sandbox", "cuda-host")
    c.provision_skeleton()
    c.bind_mount("/usr", "/usr", true)
    c.bind_mount("/lib64", "/lib64", true)
    
    // Map host device nodes into container /dev
    c.share_hardware()
    
    // Run an isolated CUDA/GPU script
    c.run("nvidia-smi")
    c.cleanup()
```

---

## 3. Self-Destructing Vacuum Sandboxes

To prevent disk bloat and handle host resource constraints effectively, Cluster Containers implement deterministic cleanup. Using the `defer` block, mounts are automatically torn down and files are deleted when scope exits:

```python
fn run_isolated():
    c := container::create("job-runner", "/tmp/job_root", "job-host")
    c.provision_skeleton()
    c.bind_mount("/bin", "/bin", true)
    
    // Defer guarantees cleanup even if the function crashes
    defer c.cleanup()
    
    c.run("/bin/sh -c 'echo Running task...'")
    // Cleanup is automatically invoked here!
```

Under the hood, `c.cleanup()` performs lazy unmounting (`umount2` with the `MNT_DETACH` flag) on all tracked mount points to ensure lingering filesystems are safely detached, followed by recursive deletion of the sandbox root directory.

---

## 4. Comparison: Cluster vs. Docker/YAML

| Feature | Cluster Containers (`clc`) | Docker / Podman + YAML |
| :--- | :--- | :--- |
| **Engine Requirements** | Zero (Runs natively via host system calls) | Requires Docker/Podman Daemon |
| **Configuration Style** | Type-safe, compiled program code | Static, untyped YAML files |
| **Execution Performance** | Native process execution (zero VM layers) | Container virtualization overhead |
| **Hardware Access** | Direct dev-node sharing (`share_hardware()`) | Restricted configuration permissions |
| **Cleanup Guarantees** | Deterministic scope-based `defer` | Manual prune or orphan container risk |

---

## 5. Complete Example: Scriptable CI/CD Runner

This script represents a complete programmable job executor. It provisions a clean container filesystem, maps host devices, executes isolated commands, and guarantees a full teardown on completion:

```python
fn execute_task(task_cmd: string) -> int:
    put "Preparing sandbox rootfs..."
    c := container::create("task-runner", "/tmp/clc_sandbox", "runner-host")
    
    // Auto-cleanup on exit
    defer c.cleanup()
    
    c.provision_skeleton()
    
    // Bind mount host binaries
    c.bind_mount("/bin", "/bin", true)
    c.bind_mount("/lib", "/lib", true)
    c.bind_mount("/lib64", "/lib64", true)
    c.bind_mount("/usr", "/usr", true)
    
    // Mount isolated processes interfaces
    c.mount_proc()
    c.share_hardware()
    
    put "Entering sandbox..."
    exit_code := c.run(task_cmd)
    
    return exit_code

fn main():
    // Programmable loop to run multiple jobs
    cmd := "/bin/sh -c 'echo Hostname inside sandbox:; hostname; ls -la /'"
    status := execute_task(cmd)
    put "Task exited with status code: " + to_text(status)
```
