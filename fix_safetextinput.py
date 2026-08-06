import re

with open('src/components/SafeTextInput.tsx', 'r') as f:
    content = f.read()

target_props = """  maxLength,
  id,"""

replacement_props = """  maxLength,
  id,"""

# Actually I can just modify the render block of SafeTextInput
target_render = """  return (
    <div className="w-full space-y-1 text-left relative">
      {type === "textarea" ? (
        <textarea
          ref={textareaRef}
          id={id}
          required={required}
          maxLength={maxLength}"""

replacement_render = """  const effectiveMaxLength = type === "textarea" ? (maxLength && maxLength < 512 ? maxLength : 512) : (maxLength && maxLength < 126 ? maxLength : 126);
  if (type === "textarea") {
    console.log("[INPUT] Textarea limit: 512");
  } else {
    console.log("[INPUT] Text input limit: 126");
  }

  return (
    <div className="w-full space-y-1 text-left relative">
      {type === "textarea" ? (
        <textarea
          ref={textareaRef}
          id={id}
          required={required}
          maxLength={effectiveMaxLength}"""

content = content.replace(target_render, replacement_render)

target_input = """        <input
          id={id}
          type="text"
          required={required}
          maxLength={maxLength}"""

replacement_input = """        <input
          id={id}
          type="text"
          required={required}
          maxLength={effectiveMaxLength}"""

content = content.replace(target_input, replacement_input)

with open('src/components/SafeTextInput.tsx', 'w') as f:
    f.write(content)
