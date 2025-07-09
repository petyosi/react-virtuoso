# React Virtuoso Benchmarks

This file contains comprehensive performance benchmarks for React Virtuoso using the standard parameters:

## Standard Parameters
- **Item Count**: 10,000 items
- **Item Size**: 35px
- **Runs per benchmark**: 5

## Benchmark Categories

### Size System Performance
Tests the performance of the core size management system that handles item sizing and positioning.

- **Sequential size range insertion**: Measures how fast the system can handle setting up initial sizes for all items
- **Random size updates**: Tests performance when items change size dynamically (simulates real-world dynamic content)
- **Jagged list performance**: Measures handling of lists with varied item sizes

### List System Performance
Tests the core list virtualization system that determines which items to render.

- **Initial list rendering**: Measures time to setup and render initial viewport items
- **Scroll performance simulation**: Tests performance during scrolling through the list

### Grid System Performance
Tests the grid virtualization system for 2D layouts.

- **Grid initialization**: Measures setup time for grid layouts

### Memory and Scale Tests
Tests performance at different scales and configurations.

- **Large list initialization**: Tests with 50,000 items (5x standard)
- **Tiny item performance**: Tests with 10px items instead of 35px

### Stress Tests
Tests performance under challenging conditions.

- **Frequent size changes**: Simulates applications with rapidly changing content sizes

## Running Benchmarks

To run the benchmarks:

```bash
# Run all benchmarks
npx vitest test/benchmark.test.ts

# Run benchmarks with verbose output
npx vitest test/benchmark.test.ts --reporter=verbose

# Run specific benchmark category
npx vitest test/benchmark.test.ts -t "Size System Performance"
```

## Performance Expectations

The benchmarks include reasonable performance expectations:

- **Sequential operations**: Should complete in under 1ms for basic operations
- **Bulk operations**: Should handle 1000+ updates in under 200ms
- **Initialization**: Should render initial state in under 10ms
- **Scrolling**: Should handle 50 scroll updates in under 100ms
- **Scale**: Should handle 50k items without significant degradation

## Integration

These benchmarks are designed to:
1. Run as part of the regular test suite
2. Provide performance regression detection
3. Guide optimization efforts
4. Document expected performance characteristics

The benchmarks use the same testing infrastructure as the existing tests (vitest) and follow similar patterns to the existing performance tests in `sizeSystem.test.ts`.