# Interweave

This is an Obsidian plugin that lets you effortlessly create informative Venn diagrams right within your notes. Visually compare and contrast concepts, highlight relationships, and bring clarity to your knowledge base.

## Example

```interweave
- sets:
  - A
  size: 12
  color: "#FF0000"
  opacity: 1
- sets:
  - B
  size: 12
  color: "#00FF00"
  opacity: 0.4
- sets:
  - A
  - B
  size: 3
  color: rgb(0,0,255)
  opacity: 1
```

<img src="">

## Syntax

Interweave uses a clear and concise syntax similar to YAML to define your Venn diagram. This makes it easy to create beautiful visuals without complex code. Here's how it works:

1. Define Sets:

Start by listing your sets. Each set represents a group of related concepts.

```interweave
- sets:
  - Name of Set
  size: 12
  color: "#FF0000"
  opacity: 1
# You can add more sets
```

2. Customize Sets:

Within each set definition, you can use properties to control its appearance:

 - labels (written as sublist): (Required) Text displayed inside the circle representing the set.
 - size: (Required) Controls the relative size of the circle (e.g., size: 12 for a larger circle).
 - color: (Optional) CSS code for the set's circle color (e.g., color: #ff0000 or rgb(255,0,0) for red).
 - opacity: (Optional) Controls the transparency of the circle (e.g., opacity: 0.5 for a semi-transparent circle).

3. Intersections:

You can also define an intersections using already known tools.

```interweave
# Add first set.
- sets:
  - A
  size: 12
  color: "#FF0000"
  opacity: 1
# Add second set.
- sets:
  - B
  size: 12
  color: "#00FF00"
  opacity: 1
# Add intersection.
- sets:
  - A
  - B
  size: 3
  color: "#0000FF"
  opacity: 1
```

3. Keep it Simple!

Interweave focuses on simplicity.  Properties like position (circles are automatically arranged) and border are not currently supported, but may be added in future updates.

**Remember**: put everything within the \`\`\`interweave block.