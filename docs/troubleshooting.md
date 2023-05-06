---
id: troubleshooting
title: Troubleshooting React Virtuoso
sidebar_label: Troubleshooting
slug: /troubleshooting
sidebar_position: 2
---

React Virtuoso tries to hide as much complexity as possible while maintaining sensible behavior with any configuration. 
The magic has certain limits, so please check this section if something does not work as you expect.

## List is jumping around or misbehaving

The list relies on measuring the item sizes and dynamically updating its position based on the received data. 
This is more of an art than science in some use cases, especially when it comes to reverse scrolling. 
Certain content factors like dynamic content (images, iframes, etc.) can cause trouble. 

To get a better sense of whether this is your case, you can enable debug logging either by setting the `logLevel` property to `LogLevel.DEBUG` or by setting a `globalThis.VIRTUOSO_LOG_LEVEL` to `LogLevel.DEBUG`. 
Import `LogLevel` from the `react-virtuoso` package.
Afterward, set the logging level in your browser to `"all levels"` and observe the messages for unexpected item sizes reported outside of the normal render cycle. 

## List does not scroll to the bottom / items jump around

This is the most common setup error. It happens because the DOM elements inside the items (or the items themselves) have margins. 
Margins are hard to measure, more so if they collapse. Some elements (for example, `p`, `h*`, `ul`) have default margins.

### Fix
Use your browser inspector (the `computed` tab next to `styles`) and examine the list items. Margins are usually easy to spot. 
Replace them with padding.

## I get "Error: zero-sized element, this should not happen"

Technically, this could have been a warning, but it is usually a sign of something not working as expected, so throwing an error seems better.
This means that you either have empty items (something which Virtuoso can't support), or you are hitting a bug of some sort 
(could be due to some exotic integration scenario).

### Fix
If you have zero-height items, you need to filter those out before passing them to the component. 
The internal data structure needs a distinct position for each item. There's no way to fix this.

If you see this in another case (a user reported a problem in Cypress), 
please reproduce it in codesandbox and post a comment in [Issue #206](https://github.com/petyosi/react-virtuoso/issues/206).

## Experiencing something else?

Please [open an issue](https://github.com/petyosi/react-virtuoso/issues/new) with reproduction in codesandbox.
 
