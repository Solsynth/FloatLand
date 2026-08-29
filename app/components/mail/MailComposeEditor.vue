<template>
  <div
    class="group relative flex w-full flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 focus-within:border-primary/50"
  >
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 border-b border-base-300 px-2 py-1.5">
      <button
        v-for="item in toolbar"
        :key="item.label"
        type="button"
        class="btn btn-ghost btn-xs gap-1 px-1.5"
        :class="item.active?.() ? 'bg-primary/10 text-primary' : 'text-base-content/60'"
        :title="item.label"
        @mousedown.prevent="item.run()"
      >
        <component :is="item.icon" class="h-3.5 w-3.5" />
      </button>
      <span class="mx-1 h-4 w-px bg-base-300" />
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1 px-1.5"
        :class="editor?.can().undo() ? 'text-base-content/60' : 'text-base-content/25'"
        title="Undo"
        @mousedown.prevent="undo"
      >
        <IconUndo class="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1 px-1.5"
        :class="editor?.can().redo() ? 'text-base-content/60' : 'text-base-content/25'"
        title="Redo"
        @mousedown.prevent="redo"
      >
        <IconRedo class="h-3.5 w-3.5" />
      </button>
    </div>

    <EditorContent :editor="editor" class="min-h-0 flex-1" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
  IconList,
  IconListOrdered,
  IconQuote,
  IconCode,
  IconLink,
  IconUnlink,
  IconUndo,
  IconRedo,
  IconHeading,
  IconMinus,
} from "#components";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editor = useEditor({
  content: props.modelValue || "",
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder || "",
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
  ],
  editorProps: {
    attributes: {
      class:
        "prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[16rem]",
    },
  },
  onUpdate: ({ editor }) => {
    emit("update:modelValue", editor.getHTML());
  },
});

// Keep the v-model prop in sync when external code replaces the content
// (e.g. replying to a different email). Guarded so we don't clobber typing.
watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    if (value !== editor.value.getHTML()) {
      editor.value.commands.setContent(value || "", { emitUpdate: false });
    }
  },
);

function run(command: (chain: any) => any) {
  if (!editor.value) return;
  command(editor.value.chain().focus());
}

function undo() {
  if (!editor.value) return;
  editor.value.chain().focus().undo().run();
}

function redo() {
  if (!editor.value) return;
  editor.value.chain().focus().redo().run();
}

const toolbar = [
  {
    label: "Bold",
    icon: IconBold,
    run: () => run((c) => c.toggleBold().run()),
    active: () => editor.value?.isActive("bold") ?? false,
  },
  {
    label: "Italic",
    icon: IconItalic,
    run: () => run((c) => c.toggleItalic().run()),
    active: () => editor.value?.isActive("italic") ?? false,
  },
  {
    label: "Underline",
    icon: IconUnderline,
    run: () => run((c) => c.toggleUnderline().run()),
    active: () => editor.value?.isActive("underline") ?? false,
  },
  {
    label: "Strikethrough",
    icon: IconStrikethrough,
    run: () => run((c) => c.toggleStrike().run()),
    active: () => editor.value?.isActive("strike") ?? false,
  },
  {
    label: "Inline code",
    icon: IconCode,
    run: () => run((c) => c.toggleCode().run()),
    active: () => editor.value?.isActive("code") ?? false,
  },
  {
    label: "Heading",
    icon: IconHeading,
    run: () => run((c) => c.toggleHeading({ level: 2 }).run()),
    active: () => editor.value?.isActive("heading", { level: 2 }) ?? false,
  },
  {
    label: "Bulleted list",
    icon: IconList,
    run: () => run((c) => c.toggleBulletList().run()),
    active: () => editor.value?.isActive("bulletList") ?? false,
  },
  {
    label: "Numbered list",
    icon: IconListOrdered,
    run: () => run((c) => c.toggleOrderedList().run()),
    active: () => editor.value?.isActive("orderedList") ?? false,
  },
  {
    label: "Blockquote",
    icon: IconQuote,
    run: () => run((c) => c.toggleBlockquote().run()),
    active: () => editor.value?.isActive("blockquote") ?? false,
  },
  {
    label: "Horizontal rule",
    icon: IconMinus,
    run: () => run((c) => c.setHorizontalRule().run()),
    active: () => false,
  },
  {
    label: "Link",
    icon: IconLink,
    run: () => {
      if (!editor.value) return;
      const prev = editor.value.getAttributes("link").href;
      const href = window.prompt("Link URL", prev)?.trim();
      if (href === null) return;
      if (href === "") {
        editor.value.chain().focus().unsetLink().run();
        return;
      }
      editor.value.chain().focus().setLink({ href }).run();
    },
    active: () => editor.value?.isActive("link") ?? false,
  },
  {
    label: "Remove link",
    icon: IconUnlink,
    run: () => run((c) => c.unsetLink().run()),
    active: () => false,
  },
];

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
:deep(.tiptap) {
  min-height: 16rem;
}
:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: rgb(var(--bc) / 0.35);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
